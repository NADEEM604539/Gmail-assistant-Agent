from email.utils import parseaddr, parsedate_to_datetime, getaddresses
from datetime import datetime
import base64
from bs4 import BeautifulSoup


# --------------------------------------------------
# Helpers
# --------------------------------------------------

def format_time(dt):
    if not dt:
        return ""

    now = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.now()

    if dt.date() == now.date():
        return dt.strftime("%I:%M %p").lstrip("0")

    diff = (now.date() - dt.date()).days

    if diff == 1:
        return "Yesterday"

    if diff < 7:
        return f"{diff} days ago"

    return dt.strftime("%d %b")


def format_sent_time(dt):
    if not dt:
        return ""

    now = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.now()

    if dt.date() == now.date():
        return f"Today {dt.strftime('%I:%M %p').lstrip('0')}"

    diff = (now.date() - dt.date()).days

    if diff == 1:
        return f"Yesterday {dt.strftime('%I:%M %p').lstrip('0')}"

    return dt.strftime("%d %b %I:%M %p").lstrip("0")


def get_headers(payload):
    return {
        h["name"]: h["value"]
        for h in payload.get("headers", [])
    }


def get_email_body(payload):
    if "parts" in payload:

        for part in payload["parts"]:
            if part["mimeType"] == "text/plain":
                data = part["body"].get("data")
                if data:
                    return base64.urlsafe_b64decode(data + "==").decode()

        for part in payload["parts"]:
            if part["mimeType"] == "text/html":
                data = part["body"].get("data")
                if data:
                    html = base64.urlsafe_b64decode(data + "==").decode()
                    return BeautifulSoup(html, "html.parser").get_text()

    data = payload.get("body", {}).get("data")
    if data:
        return base64.urlsafe_b64decode(data + "==").decode()

    return ""


def get_recipients(headers):

    recipients = []

    for rtype, header in [
        ("to", headers.get("To")),
        ("cc", headers.get("Cc")),
        ("bcc", headers.get("Bcc")),
    ]:

        if not header:
            continue

        for name, email in getaddresses([header]):
            recipients.append({
                "type": rtype,
                "name": name,
                "email": email,
            })

    return recipients


def get_attachments(payload):

    attachments = []

    def walk(parts):
        for part in parts:

            if part.get("parts"):
                walk(part["parts"])

            body = part.get("body", {})

            if body.get("attachmentId"):
                attachments.append({
                    "filename": part.get("filename"),
                    "mime_type": part.get("mimeType"),
                    "attachment_id": body["attachmentId"],
                    "size": body.get("size", 0),
                })

    walk(payload.get("parts", []))

    return attachments


def get_category(labels):

    mapping = {
        "CATEGORY_PERSONAL": "Personal",
        "CATEGORY_SOCIAL": "Social",
        "CATEGORY_PROMOTIONS": "Promotions",
        "CATEGORY_UPDATES": "Updates",
        "CATEGORY_FORUMS": "Forums",
    }

    for gmail_label, name in mapping.items():
        if gmail_label in labels:
            return name

    return "General"


def get_folder(labels):

    if "DRAFT" in labels:
        return "draft"

    if "SENT" in labels:
        return "sent"

    if "SPAM" in labels:
        return "spam"

    if "TRASH" in labels:
        return "trash"

    return "inbox"


# --------------------------------------------------
# Universal Parser
# --------------------------------------------------

def Short_email_parser(email):

    payload = email["payload"]

    headers = get_headers(payload)

    labels = email.get("labelIds", [])

    body = get_email_body(payload)

    recipients = get_recipients(headers)

    attachments = get_attachments(payload)

    sender_name, sender_email = parseaddr(headers.get("From", ""))

    try:
        dt = parsedate_to_datetime(headers["Date"])
    except Exception:
        dt = None

    folder = get_folder(labels)

    if folder == "draft":
        status = "Draft"
    elif folder == "sent":
        status = "Delivered"
    elif "UNREAD" in labels:
        status = "Unread"
    else:
        status = "Read"

    return {

        # -------------------------------
        # IDs
        # -------------------------------

        "id": email["id"],
        "threadId": email["threadId"],
        "historyId": int(email.get("historyId", 0)),

        # -------------------------------
        # Folder
        # -------------------------------

        "folder": folder,
        "labels": labels,

        # -------------------------------
        # People
        # -------------------------------

        "from": {
            "name": sender_name,
            "email": sender_email,
        },

        "to": [r for r in recipients if r["type"] == "to"],
        "cc": [r for r in recipients if r["type"] == "cc"],
        "bcc": [r for r in recipients if r["type"] == "bcc"],

        # -------------------------------
        # Content
        # -------------------------------

        "subject": headers.get("Subject", ""),
        "preview": email.get("snippet", ""),
        "body": body,

        # -------------------------------
        # Time
        # -------------------------------

        "date": dt,
        "time": format_time(dt),
        "sentTime": format_sent_time(dt),

        # -------------------------------
        # Flags
        # -------------------------------

        "status": status,
        "unread": "UNREAD" in labels,
        "starred": "STARRED" in labels,
        "important": "IMPORTANT" in labels,

        "importance": (
            "high"
            if "IMPORTANT" in labels
            else "normal"
        ),

        # -------------------------------
        # Attachments
        # -------------------------------

        "attachments": attachments,
        "hasAttachment": len(attachments) > 0,

        # -------------------------------
        # UI Helpers
        # -------------------------------

        "category": get_category(labels),

        "displayName": (
            sender_name
            if folder == "inbox"
            else (
                recipients[0]["name"]
                if recipients and recipients[0]["name"]
                else (
                    recipients[0]["email"]
                    if recipients
                    else "No recipient"
                )
            )
        ),

        "displayEmail": (
            sender_email
            if folder == "inbox"
            else (
                recipients[0]["email"]
                if recipients
                else ""
            )
        ),
    }