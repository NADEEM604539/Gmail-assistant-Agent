"""
Full-detail Gmail API message parser.

Unlike a "short" parser that only pulls subject/from/snippet/top-level
attachments, this walks the ENTIRE MIME tree, preserves every header
(including repeated ones like `Received`), separates inline content
(cid: images) from real attachments, extracts threading/reply-chain
info, decodes bodies with the correct charset, and pulls out
authentication (SPF/DKIM/DMARC) and mailing-list metadata.

Usage:
    from email_parser import parse_email_full
    parsed = parse_email_full(gmail_message_dict)
"""

from __future__ import annotations

import base64
import binascii
import re
from email.utils import parseaddr, parsedate_to_datetime, getaddresses
from typing import Any, Dict, List, Optional

from bs4 import BeautifulSoup


# --------------------------------------------------------------------------
# Low level helpers
# --------------------------------------------------------------------------

def _b64_decode(data: Optional[str]) -> bytes:
    """Gmail uses base64url without padding. Decode safely to raw bytes."""
    if not data:
        return b""
    padded = data + "=" * (-len(data) % 4)
    try:
        return base64.urlsafe_b64decode(padded)
    except (binascii.Error, ValueError):
        return b""


def _extract_charset(content_type_header: Optional[str]) -> str:
    """Pull charset= out of a raw Content-Type header value, default utf-8."""
    if not content_type_header:
        return "utf-8"
    match = re.search(r'charset=["\']?([\w\-]+)', content_type_header, re.I)
    return match.group(1) if match else "utf-8"


def _decode_bytes(raw: bytes, charset: str = "utf-8") -> str:
    """Decode bytes, falling back gracefully if the declared charset lies."""
    for candidate in (charset, "utf-8", "latin-1"):
        try:
            return raw.decode(candidate)
        except (LookupError, UnicodeDecodeError):
            continue
    return raw.decode("utf-8", errors="replace")


def _part_headers(part: Dict[str, Any]) -> Dict[str, str]:
    """First-value-wins header dict for a single MIME part."""
    return {h["name"]: h["value"] for h in part.get("headers", [])}


def _content_disposition(part_headers: Dict[str, str]) -> Dict[str, Any]:
    """Parse the Content-Disposition header into {type, filename}."""
    raw = part_headers.get("Content-Disposition", "")
    disp_type = raw.split(";")[0].strip().lower() or None
    filename_match = re.search(r'filename\*?=["\']?([^"\';]+)', raw, re.I)
    filename = filename_match.group(1).strip() if filename_match else None
    return {"disposition": disp_type, "filename": filename}


# --------------------------------------------------------------------------
# MIME tree traversal
# --------------------------------------------------------------------------

def _walk_parts(payload: Dict[str, Any]):
    """
    Depth-first walk of the entire MIME tree (payload IS the root part).
    Yields every part, including nested multipart/alternative inside
    multipart/mixed inside multipart/related, etc. Gmail can nest several
    levels deep (e.g. mixed -> related -> alternative -> plain/html).
    """
    stack = [payload]
    while stack:
        part = stack.pop(0)
        yield part
        children = part.get("parts")
        if children:
            stack = list(children) + stack


def _extract_bodies(payload: Dict[str, Any]) -> Dict[str, Optional[str]]:
    """
    Return the best plain-text and HTML bodies found anywhere in the tree,
    plus an HTML-stripped-to-text fallback for clients that only want text.
    Uses the first plain/html part encountered (multipart/alternative puts
    the richest version last, so we don't just grab payload['parts'][0]).
    """
    plain_body: Optional[str] = None
    html_body: Optional[str] = None

    for part in _walk_parts(payload):
        mime_type = part.get("mimeType", "")
        body = part.get("body", {})
        data = body.get("data")
        if not data:
            continue

        part_headers = _part_headers(part)
        # Skip attachments/inline files even if they happen to be text/html etc.
        disp = _content_disposition(part_headers)["disposition"]
        if disp == "attachment":
            continue

        charset = _extract_charset(part_headers.get("Content-Type"))
        text = _decode_bytes(_b64_decode(data), charset)

        if mime_type == "text/plain" and plain_body is None:
            plain_body = text
        elif mime_type == "text/html" and html_body is None:
            html_body = text

    html_as_text = None
    if html_body:
        html_as_text = BeautifulSoup(html_body, "html.parser").get_text(
            separator="\n"
        ).strip()

    return {
        "plain": plain_body,
        "html": html_body,
        "html_as_text": html_as_text,
        # Best available body text, preferring real plain-text over stripped HTML
        "text": plain_body if plain_body is not None else html_as_text,
    }


def _extract_attachments(payload: Dict[str, Any]) -> Dict[str, list]:
    """
    Walk every part and split into real (downloadable) attachments vs.
    inline content (e.g. images referenced by `cid:` inside HTML bodies).
    """
    attachments: List[Dict[str, Any]] = []
    inline: List[Dict[str, Any]] = []

    for part in _walk_parts(payload):
        body = part.get("body", {})
        attachment_id = body.get("attachmentId")
        filename = part.get("filename") or None

        # A "real" attachment either has a Gmail attachmentId, or is a
        # non-text/non-multipart part with a filename.
        if not attachment_id and not filename:
            continue

        part_headers = _part_headers(part)
        disp_info = _content_disposition(part_headers)
        content_id = part_headers.get("Content-ID", "").strip("<>") or None

        record = {
            "filename": filename or disp_info["filename"],
            "mime_type": part.get("mimeType"),
            "attachment_id": attachment_id,
            "size": body.get("size"),
            "content_id": content_id,
            "disposition": disp_info["disposition"],
        }

        if disp_info["disposition"] == "inline" or content_id:
            inline.append(record)
        else:
            attachments.append(record)

    return {"attachments": attachments, "inline": inline}


# --------------------------------------------------------------------------
# Header-level extraction
# --------------------------------------------------------------------------

def _grouped_headers(payload: Dict[str, Any]) -> Dict[str, List[str]]:
    """
    Every header value, grouped by name, preserving repeats (a message can
    have multiple `Received` hops, multiple `X-...` headers, etc.).
    """
    grouped: Dict[str, List[str]] = {}
    for h in payload.get("headers", []):
        grouped.setdefault(h["name"], []).append(h["value"])
    return grouped


def _first_header(grouped: Dict[str, List[str]], name: str, default: str = "") -> str:
    values = grouped.get(name)
    return values[0] if values else default


def _extract_recipients(grouped: Dict[str, List[str]]) -> List[Dict[str, str]]:
    recipients = []
    for recipient_type, header_name in (
        ("to", "To"),
        ("cc", "Cc"),
        ("bcc", "Bcc"),
        ("reply_to", "Reply-To"),
    ):
        values = grouped.get(header_name)
        if not values:
            continue
        for name, address in getaddresses(values):
            if address:
                recipients.append(
                    {"name": name, "email": address, "type": recipient_type}
                )
    return recipients


def _extract_thread_info(grouped: Dict[str, List[str]], subject: str) -> Dict[str, Any]:
    """Reply/forward chain metadata."""
    message_id = _first_header(grouped, "Message-ID") or None
    in_reply_to = _first_header(grouped, "In-Reply-To") or None
    references_raw = _first_header(grouped, "References")
    references = references_raw.split() if references_raw else []

    subject_lower = subject.strip().lower()
    is_reply = bool(in_reply_to) or subject_lower.startswith(("re:", "re :"))
    is_forward = subject_lower.startswith(("fwd:", "fw:", "fwd :"))

    return {
        "message_id": message_id,
        "in_reply_to": in_reply_to,
        "references": references,
        "reference_count": len(references),
        "is_reply": is_reply,
        "is_forward": is_forward,
    }


_AUTH_RESULT_RE = re.compile(r"(spf|dkim|dmarc)=([a-z]+)", re.I)


def _extract_security(grouped: Dict[str, List[str]]) -> Dict[str, Any]:
    """Parse SPF/DKIM/DMARC verdicts out of Authentication-Results / Received-SPF."""
    auth_header = " ".join(grouped.get("Authentication-Results", []))
    received_spf = _first_header(grouped, "Received-SPF")

    results = {"spf": None, "dkim": None, "dmarc": None}
    for mechanism, verdict in _AUTH_RESULT_RE.findall(auth_header):
        results[mechanism.lower()] = verdict.lower()

    if results["spf"] is None and received_spf:
        first_word = received_spf.strip().split()[0].lower() if received_spf.strip() else None
        results["spf"] = first_word

    return {
        **results,
        "raw_authentication_results": auth_header or None,
        "raw_received_spf": received_spf or None,
    }


def _extract_mailing_list_info(grouped: Dict[str, List[str]]) -> Dict[str, Any]:
    return {
        "list_unsubscribe": _first_header(grouped, "List-Unsubscribe") or None,
        "list_id": _first_header(grouped, "List-Id") or None,
        "precedence": _first_header(grouped, "Precedence") or None,
        "is_bulk": _first_header(grouped, "Precedence").lower() == "bulk"
        if grouped.get("Precedence")
        else False,
        "is_auto_generated": bool(
            grouped.get("Auto-Submitted") or grouped.get("X-Autoreply")
        ),
    }


_CATEGORY_LABELS = {
    "CATEGORY_PERSONAL": "personal",
    "CATEGORY_SOCIAL": "social",
    "CATEGORY_PROMOTIONS": "promotions",
    "CATEGORY_UPDATES": "updates",
    "CATEGORY_FORUMS": "forums",
}

_FOLDER_PRIORITY = ["DRAFT", "SENT", "TRASH", "SPAM", "INBOX", "CHAT"]


def _extract_folder(labels: List[str]) -> str:
    for candidate in _FOLDER_PRIORITY:
        if candidate in labels:
            return candidate.lower()
    return "other"


def _extract_flags(labels: List[str]) -> Dict[str, bool]:
    return {
        "unread": "UNREAD" in labels,
        "starred": "STARRED" in labels,
        "important": "IMPORTANT" in labels,
        "draft": "DRAFT" in labels,
        "sent": "SENT" in labels,
        "trashed": "TRASH" in labels,
        "spam": "SPAM" in labels,
        "chat": "CHAT" in labels,
        "snoozed": "SNOOZED" in labels,
        "muted": "MUTED" in labels,
    }


def _domain(address: str) -> Optional[str]:
    if "@" not in address:
        return None
    return address.rsplit("@", 1)[-1].lower()


# --------------------------------------------------------------------------
# Public entry point
# --------------------------------------------------------------------------

def parse_email_full(email: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse a raw Gmail API `messages.get` response (format=full) into a
    single rich dict covering headers, threading, security, MIME structure,
    bodies, and attachments.
    """
    payload = email.get("payload", {})
    grouped = _grouped_headers(payload)
    flat_headers = {name: values[0] for name, values in grouped.items()}

    labels = email.get("labelIds", [])
    subject = flat_headers.get("Subject", "")

    sender_name, sender_email = parseaddr(flat_headers.get("From", ""))

    try:
        date = parsedate_to_datetime(flat_headers["Date"])
    except Exception:
        date = None

    bodies = _extract_bodies(payload)
    attachment_data = _extract_attachments(payload)

    # MIME structure summary: every part's type, useful for debugging
    # "why didn't the body show up" issues.
    mime_structure = [
        {
            "mime_type": part.get("mimeType"),
            "filename": part.get("filename") or None,
            "has_body": bool(part.get("body", {}).get("data")),
            "has_attachment_id": bool(part.get("body", {}).get("attachmentId")),
        }
        for part in _walk_parts(payload)
    ]

    return {
        # --- identity -------------------------------------------------
        "id": email.get("id"),
        "thread_id": email.get("threadId"),
        "history_id": int(email.get("historyId", 0)),
        "internal_date": int(email.get("internalDate", 0)) or None,
        "size_estimate": email.get("sizeEstimate"),

        # --- envelope ---------------------------------------------------
        "subject": subject,
        "snippet": email.get("snippet", ""),
        "date": date,

        "from": {"name": sender_name, "email": sender_email, "domain": _domain(sender_email)},
        "to": [r for r in _extract_recipients(grouped) if r["type"] == "to"],
        "cc": [r for r in _extract_recipients(grouped) if r["type"] == "cc"],
        "bcc": [r for r in _extract_recipients(grouped) if r["type"] == "bcc"],
        "reply_to": [r for r in _extract_recipients(grouped) if r["type"] == "reply_to"],

        # --- body ---------------------------------------------------------
        "body": bodies["text"],
        "body_plain": bodies["plain"],
        "body_html": bodies["html"],
        "body_html_as_text": bodies["html_as_text"],

        # --- attachments ----------------------------------------------------
        "attachments": attachment_data["attachments"],
        "inline_attachments": attachment_data["inline"],
        "attachment_count": len(attachment_data["attachments"]),

        # --- threading / conversation -----------------------------------------
        "thread": _extract_thread_info(grouped, subject),

        # --- labels / flags / folder ----------------------------------------
        "labels": labels,
        "category": next(
            (v for k, v in _CATEGORY_LABELS.items() if k in labels), None
        ),
        "folder": _extract_folder(labels),
        "flags": _extract_flags(labels),

        # --- security / provenance ---------------------------------------------
        "security": _extract_security(grouped),
        "mailing_list": _extract_mailing_list_info(grouped),

        # --- raw / structural data (for anything not covered above) -------------
        "mime_type": payload.get("mimeType"),
        "mime_structure": mime_structure,
        "headers": flat_headers,          # convenience: first value per header
        "raw_headers": grouped,           # full fidelity: all values per header
    }


# Kept for drop-in compatibility with the short parser's helper names.
def get_headers(payload: Dict[str, Any]) -> Dict[str, str]:
    return {h["name"]: h["value"] for h in payload.get("headers", [])}


def get_email_body(payload: Dict[str, Any]) -> str:
    """Backwards-compatible shim: returns the best available body text."""
    return _extract_bodies(payload)["text"] or ""