import requests

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import base64
from types import SimpleNamespace  # add to imports at top
from bs4 import BeautifulSoup
from email.utils import parseaddr
from email.utils import getaddresses
from email.utils import parsedate_to_datetime
from app.gmail.Parser.cardEmailParser import Card_email_parser
from app.gmail.Parser.shortEmailParser import Short_email_parser
from app.gmail.Parser.fullEmailParser import parse_email_full
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from typing import List
from email import encoders
import mimetypes
import os
from app.gmail.DTO import DraftPayload
from app.chatbot.agent.objects import ReplyEmail
from app.chatbot.agent.objects import DraftEmail, EmailRecipient



class GmailService:
    TOKEN_URL = "https://oauth2.googleapis.com/token"

    def __init__(
        self,
        refresh_token: str,
        client_id: str,
        client_secret: str,
    ):
        self.refresh_token = refresh_token
        self.client_id = client_id
        self.client_secret = client_secret

        self.service = self._create_service()

    def _get_access_token(self) -> str:
        response = requests.post(
            self.TOKEN_URL,
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": self.refresh_token,
                "grant_type": "refresh_token",
            },
        )

        response.raise_for_status()

        token_data = response.json()

        return token_data["access_token"]

    def _create_service(self):
        access_token = self._get_access_token()

        credentials = Credentials(token=access_token)

        return build(
            "gmail",
            "v1",
            credentials=credentials,
            cache_discovery=False,
        )

    # -------------------------
    # Gmail Methods
    # -------------------------

    def list_messages(self, max_results=10):
        response = (
            self.service.users()
            .messages()
            .list(
                userId="me",
                maxResults=max_results,
            )
            .execute()
        )

        return response.get("messages", [])

    def get_message(self, message_id):
        return (
            self.service.users()
            .messages()
            .get(
                userId="me",
                id=message_id,
                format="full",
            )
            .execute()
        )

    def get_thread_messages(self, thread_id):
        response = (
            self.service.users()
            .threads()
            .get(
                userId="me",
                id=thread_id,
                format="full",
            )
            .execute()
        )

        messages = []
        for item in response.get("messages", []):
            parsed = parse_email_full(item)
            messages.append(parsed)

        messages.sort(key=lambda msg: (msg.get("internal_date") or 0, msg.get("id") or ""))
        return messages

    def send_message(self, body):
        return (
            self.service.users()
            .messages()
            .send(
                userId="me",
                body=body,
            )
            .execute()
        )

    def watch(self, topic_name):
        return (
            self.service.users()
            .watch(
                userId="me",
                body={
                    "labelIds": ["INBOX"],
                    "topicName": topic_name,
                },
            )
            .execute()
        )


    def fetch_latest_emails(self, max_results=10, label="INBOX"):
        response = (
        self.service.users()
        .messages()
        .list(
            userId="me",
            maxResults=max_results,
             labelIds=[label],
        )
        .execute()
    )

        messages = response.get("messages", [])

        emails = []

        for msg in messages:
            email = (
                self.service.users()
                .messages()
                .get(
                    userId="me",
                    id=msg["id"],
                    format="full",
                   
                )
                .execute()
            )
            format_email = Short_email_parser(email)
            emails.append(format_email)

        return emails

    def get_headers( payload):
        headers = {}

        for header in payload.get("headers", []):
            headers[header["name"]] = header["value"]

        return headers

    def get_email_body(payload):
        if "parts" in payload:
            # Prefer plain text
            for part in payload["parts"]:
                if part["mimeType"] == "text/plain":
                    data = part["body"].get("data")
                    if data:
                        return base64.urlsafe_b64decode(data + "==").decode("utf-8")

            # Fall back to HTML
            for part in payload["parts"]:
                if part["mimeType"] == "text/html":
                    data = part["body"].get("data")
                    if data:
                        html = base64.urlsafe_b64decode(data + "==").decode("utf-8")
                        return BeautifulSoup(html, "html.parser").get_text()

        # Single-part message
        data = payload["body"].get("data")
        if data:
            return base64.urlsafe_b64decode(data + "==").decode("utf-8")

        return ""



    def fetch_emails_by_category(self, query: str, max_results: int = 5):
        
        response = (
            self.service.users()
            .messages()
            .list(
                userId="me",
                q=query,
                maxResults=max_results
            )
            .execute()
        )

        messages = response.get("messages", [])

        emails = []

        for message in messages:

            gmail_message = (
                self.service.users()
                .messages()
                .get(
                    userId="me",
                    id=message["id"],
                    format="full"
                )
                .execute()
            )

            emails.append(
                Card_email_parser(gmail_message)
            )

        return emails


    def _build_message(self, draft, include_attachments=True):
        message = MIMEMultipart()

        if draft.to:
            message["To"] = ", ".join(
                f"{r.name} <{r.email}>" if getattr(r, "name", None) else r.email
                for r in draft.to
            )

        if draft.cc:
            message["Cc"] = ", ".join(
                f"{r.name} <{r.email}>" if getattr(r, "name", None) else r.email
                for r in draft.cc
            )

        if draft.bcc:
            message["Bcc"] = ", ".join(
                f"{r.name} <{r.email}>" if getattr(r, "name", None) else r.email
                for r in draft.bcc
            )

        message["Subject"] = draft.subject
        message.attach(MIMEText(draft.body, "plain", "utf-8"))

        if include_attachments:
            for attachment in draft.attachments:
                if getattr(attachment, "content", None) is not None:
                    mime_type = attachment.mime_type or "application/octet-stream"
                    maintype, subtype = (
                        mime_type.split("/", 1)
                        if "/" in mime_type
                        else ("application", "octet-stream")
                    )
                    part = MIMEBase(maintype, subtype)
                    part.set_payload(attachment.content)
                    encoders.encode_base64(part)
                    part.add_header(
                        "Content-Disposition",
                        f'attachment; filename="{os.path.basename(attachment.filename)}"',
                    )
                    message.attach(part)
                    continue

                if not os.path.exists(attachment.filename):
                    continue

                mime_type, _ = mimetypes.guess_type(attachment.filename)
                if mime_type:
                    maintype, subtype = mime_type.split("/", 1)
                else:
                    maintype, subtype = "application", "octet-stream"

                with open(attachment.filename, "rb") as f:
                    part = MIMEBase(maintype, subtype)
                    part.set_payload(f.read())

                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f'attachment; filename="{os.path.basename(attachment.filename)}"',
                )
                message.attach(part)

        return message

    def create_draft(self, draft):
        message = self._build_message(draft)
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        body = {"message": {"raw": raw}}

        return (
            self.service.users()
            .drafts()
            .create(userId="me", body=body)
            .execute()
        )

    def get_draft_id(self, message_id: str):
        """Returns the Gmail Draft ID corresponding to a Gmail Message ID.
        Returns None if the message is not a draft.
                """

        drafts = (
            self.service.users()
            .drafts()
            .list(userId="me")
            .execute()
        )

        for draft in drafts.get("drafts", []):
            full_draft = (
                self.service.users()
                .drafts()
                .get(
                    userId="me",
                    id=draft["id"],
                    format="minimal",
                )
                .execute()
            )

            if full_draft["message"]["id"] == message_id:
                return draft["id"]

        return None

    def update_draft(self, draft_id: str, draft):
        message = self._build_message(draft)

        raw = base64.urlsafe_b64encode(
            message.as_bytes()
        ).decode()

        body = {
            "message": {
                "raw": raw
            }
        }

        result = (
            self.service.users()
            .drafts()
            .update(
                userId="me",
                id=draft_id,
                body=body,
            )
            .execute()
        )

        return {
            "draft_id": result["id"],
            "message_id": result["message"]["id"],  # New message ID
            "thread_id": result["message"]["threadId"],
        }


    def send_draft(self, draft_id: str):
        return (
        self.service.users()
        .drafts()
        .send(
            userId="me",
            body={
                "id": draft_id
            }
        )
        .execute()
    )

    def delete_draft(self, draft_id: str):
        (
        self.service.users()
        .drafts()
        .delete(
            userId="me",
            id=draft_id,
        )
        .execute()
    )

        return {
            "success": True
        }

    def send_updated_draft(self, message_id: str, draft: DraftPayload):
        draft_id = self.get_draft_id(message_id)

        if not draft_id:
            raise ValueError(f"No draft found for message_id={message_id}")

        # Preserve previously attached files if the frontend didn't
        # supply new ones for this request.
        if not draft.attachments:
            draft.attachments = self.get_message_attachments(message_id)

        updated = self.update_draft(draft_id, draft)
        result = self.send_draft(updated["draft_id"])

        return {
            "success": True,
            "message_id": result.get("id"),
            "thread_id": result.get("threadId"),
        }

    def get_message_attachments(self, message_id: str):
        """
        Fetches attachment content for an existing message so it can be
    preserved when the draft's raw MIME body is rebuilt (e.g. on Send,
    when the frontend didn't re-upload files already saved to the draft).
    """
        message = self.get_message(message_id)
        payload = message.get("payload", {})
        attachments = []

        def walk(parts):
            for part in parts:
                filename = part.get("filename")
                body = part.get("body", {})
                attachment_id = body.get("attachmentId")

                if filename and attachment_id:
                    attachment_data = (
                        self.service.users()
                        .messages()
                        .attachments()
                        .get(userId="me", messageId=message_id, id=attachment_id)
                        .execute()
                    )
                    data = attachment_data.get("data")
                    if data:
                        content = base64.urlsafe_b64decode(data + "==")
                        attachments.append(
                            SimpleNamespace(
                                filename=filename,
                                mime_type=part.get("mimeType", "application/octet-stream"),
                                content=content,
                            )
                        )

                if "parts" in part:
                    walk(part["parts"])

        walk(payload.get("parts", []))
        return attachments

    # ---------------------------------------------------------------------------
# ADDITIONS TO: app/gmail/gmail_service.py  (class GmailService)
# ---------------------------------------------------------------------------
#
# 1. Replace your existing `_build_message` with the version below — it's
#    the same as what you have, plus an optional `thread_headers` arg that
#    sets In-Reply-To / References so Gmail actually threads the message.
#
# 2. Add all the new methods below `_build_message` to the class.
#
# Needed extra imports at the top of gmail_service.py:
#   from email.utils import parseaddr, getaddresses
#   from app.chatbot.agent.objects import DraftEmail, EmailRecipient
# (parseaddr/getaddresses are already imported in your file — keep only
#  one copy if so.)
# ---------------------------------------------------------------------------


    def _build_message(self, draft, include_attachments=True, thread_headers=None):
        message = MIMEMultipart()

        if draft.to:
            message["To"] = ", ".join(
                f"{r.name} <{r.email}>" if getattr(r, "name", None) else r.email
                for r in draft.to
            )

        if draft.cc:
            message["Cc"] = ", ".join(
                f"{r.name} <{r.email}>" if getattr(r, "name", None) else r.email
                for r in draft.cc
            )

        if draft.bcc:
            message["Bcc"] = ", ".join(
                f"{r.name} <{r.email}>" if getattr(r, "name", None) else r.email
                for r in draft.bcc
            )

        message["Subject"] = draft.subject
        message.attach(MIMEText(draft.body, "plain", "utf-8"))

        # --- NEW: thread this message to an original message, if given -------
        if thread_headers and thread_headers.get("message_id_header"):
            msg_id = thread_headers["message_id_header"]
            references = thread_headers.get("references") or ""
            message["In-Reply-To"] = msg_id
            message["References"] = f"{references} {msg_id}".strip()
        # ------------------------------------------------------------------

        if include_attachments:
            for attachment in draft.attachments:
                if getattr(attachment, "content", None) is not None:
                    mime_type = attachment.mime_type or "application/octet-stream"
                    maintype, subtype = (
                        mime_type.split("/", 1)
                        if "/" in mime_type
                        else ("application", "octet-stream")
                    )
                    part = MIMEBase(maintype, subtype)
                    part.set_payload(attachment.content)
                    encoders.encode_base64(part)
                    part.add_header(
                        "Content-Disposition",
                        f'attachment; filename="{os.path.basename(attachment.filename)}"',
                    )
                    message.attach(part)
                    continue

                if not os.path.exists(attachment.filename):
                    continue

                mime_type, _ = mimetypes.guess_type(attachment.filename)
                if mime_type:
                    maintype, subtype = mime_type.split("/", 1)
                else:
                    maintype, subtype = "application", "octet-stream"

                with open(attachment.filename, "rb") as f:
                    part = MIMEBase(maintype, subtype)
                    part.set_payload(f.read())

                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f'attachment; filename="{os.path.basename(attachment.filename)}"',
                )
                message.attach(part)

        return message


# ---------------------------------------------------------------------------
# NEW METHODS — add these to the GmailService class
# ---------------------------------------------------------------------------

    def get_my_email(self):
        """The signed-in account's own address — used to drop yourself out of
        the Cc list when building a reply-all."""
        profile = self.service.users().getProfile(userId="me").execute()
        return profile.get("emailAddress", "")


    def _get_original_context(self, original_message_id):
        """Pulls the bits of the original message needed to thread a reply or
        forward: its Gmail threadId, its Message-ID header (for In-Reply-To),
        its References header, subject, and From/To/Cc for recipient building.
        """
        original = self.get_message(original_message_id)
        payload = original.get("payload", {})
        headers = {h["name"]: h["value"] for h in payload.get("headers", [])}

        return {
            "thread_id": original.get("threadId"),
            "message_id_header": headers.get("Message-ID") or headers.get("Message-Id"),
            "references": headers.get("References", ""),
            "subject": headers.get("Subject", ""),
            "from": headers.get("From", ""),
            "to": headers.get("To", ""),
            "cc": headers.get("Cc", ""),
        }


    def _build_reply_recipients(self, context, reply_all: bool):
        """to = original sender. cc (only if reply_all) = everyone else on the
        original To/Cc, minus the original sender and minus yourself."""
        sender_name, sender_email = parseaddr(context.get("from", ""))
        to_recipients = (
            [EmailRecipient(email=sender_email, name=sender_name or None)]
            if sender_email
            else []
        )

        cc_recipients = []
        if reply_all:
            my_email = self.get_my_email().lower()
            seen = {sender_email.lower()} if sender_email else set()

            for name, addr in getaddresses([context.get("to", ""), context.get("cc", "")]):
                if not addr:
                    continue
                lowered = addr.lower()
                if lowered in seen or lowered == my_email:
                    continue
                seen.add(lowered)
                cc_recipients.append(EmailRecipient(email=addr, name=name or None))

        return to_recipients, cc_recipients


    def send_reply(self, original_message_id, body, reply_all=False, attachments=None):
        """Sends a real reply immediately (not a draft), threaded into the
        original conversation via In-Reply-To / References / threadId."""
        context = self._get_original_context(original_message_id)
        to_recipients, cc_recipients = self._build_reply_recipients(context, reply_all)

        subject = context["subject"] or ""
        if not subject.lower().startswith("re:"):
            subject = f"Re: {subject}"

        draft = DraftEmail(
            subject=subject,
            body=body,
            tone="professional",
            to=to_recipients,
            cc=cc_recipients,
            bcc=[],
            attachments=attachments or [],
        )

        message = self._build_message(draft, thread_headers=context)
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

        send_body = {"raw": raw}
        if context["thread_id"]:
            send_body["threadId"] = context["thread_id"]

        return self.send_message(send_body)


    def send_forward(self, original_message_id, to, body, attachments=None):
        """Sends a forward immediately. Forwards go to new recipients, so they
        intentionally start a new thread rather than being appended to the
        original conversation."""
        context = self._get_original_context(original_message_id)

        subject = context["subject"] or ""
        if not subject.lower().startswith("fwd:"):
            subject = f"Fwd: {subject}"

        draft = DraftEmail(
            subject=subject,
            body=body,
            tone="professional",
            to=to or [],
            cc=[],
            bcc=[],
            attachments=attachments or [],
        )

        message = self._build_message(draft)
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

        return self.send_message({"raw": raw})


    def create_reply_draft(self, mode, original_message_id, body, reply_all=False, to=None, attachments=None):
        """Creates a NEW Gmail draft for a reply/reply-all/forward that's still
        in progress. Returns the draft id AND the draft's own message id — the
        message id is what you hand back to the frontend, since every other
        draft route in this codebase (`update_draft`, `send_draft`,
        `delete_draft`) already resolves the real draft id from a message id
        via `get_draft_id`. That means once this draft exists, it also works
        with those existing generic endpoints for free.
        """
        context = self._get_original_context(original_message_id)

        if mode == "forward":
            subject = context["subject"] or ""
            if not subject.lower().startswith("fwd:"):
                subject = f"Fwd: {subject}"
            to_recipients = to or []
            cc_recipients = []
            thread_headers = None
            thread_id = None
        else:
            subject = context["subject"] or ""
            if not subject.lower().startswith("re:"):
                subject = f"Re: {subject}"
            to_recipients, cc_recipients = self._build_reply_recipients(context, reply_all)
            thread_headers = context
            thread_id = context["thread_id"]

        draft = DraftEmail(
            subject=subject,
            body=body,
            tone="professional",
            to=to_recipients,
            cc=cc_recipients,
            bcc=[],
            attachments=attachments or [],
        )

        message = self._build_message(draft, thread_headers=thread_headers)
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

        create_body = {"message": {"raw": raw}}
        if thread_id:
            create_body["message"]["threadId"] = thread_id

        result = self.service.users().drafts().create(userId="me", body=create_body).execute()

        return {
            "draft_id": result["id"],
            "message_id": result["message"]["id"],
            "thread_id": result["message"].get("threadId"),
        }



    # ---------------------------------------------------------------------------
# REPLACES the earlier `update_reply_draft` in app/gmail/gmail_service.py
#
# Old design needed TWO ids (the original email + the draft). This version
# needs only ONE: the draft's own message_id. Everything else — subject,
# recipients, and the In-Reply-To / References threading headers — is read
# straight off the draft's current state in Gmail, since `create_reply_draft`
# already baked all of that in when the draft was first made.
#
# `create_reply_draft` (from the previous message) is unchanged — it still
# needs the ORIGINAL email's message_id, because that's the one time we
# genuinely need to look up what we're replying to. After that, every
# update is self-contained.
# ---------------------------------------------------------------------------

    def update_reply_draft(self, draft_message_id, body, to=None, attachments=None):
        """
        Rewrites an in-progress reply/forward draft using only its own
        message id.

        - subject: reused unchanged from the draft's current Subject header
        - to: reused from the draft's current To header, UNLESS `to` is passed
        in (this is the only case that needs it — editing forward recipients)
        - cc: always reused from the draft's current Cc header
        - In-Reply-To / References: copied verbatim from the draft's current
        headers, so the thread link set up at creation is never lost
        """
        draft_id = self.get_draft_id(draft_message_id)
        if not draft_id:
            raise ValueError(f"No draft found for message_id={draft_message_id}")

        existing = self.get_message(draft_message_id)
        payload = existing.get("payload", {})
        headers = {h["name"]: h["value"] for h in payload.get("headers", [])}
        thread_id = existing.get("threadId")

        subject = headers.get("Subject", "")

        if to is not None:
            to_recipients = to
        else:
            to_recipients = [
                EmailRecipient(email=addr, name=name or None)
                for name, addr in getaddresses([headers.get("To", "")])
                if addr
            ]

        cc_recipients = [
            EmailRecipient(email=addr, name=name or None)
            for name, addr in getaddresses([headers.get("Cc", "")])
            if addr
        ]

        draft = DraftEmail(
            subject=subject,
            body=body,
            tone="professional",
            to=to_recipients,
            cc=cc_recipients,
            bcc=[],
            attachments=attachments or [],
        )

        # No auto-append thread_headers here — we copy the existing headers
        # verbatim instead, so repeated saves don't keep re-appending the same
        # message id onto References.
        message = self._build_message(draft)

        if headers.get("In-Reply-To"):
            message["In-Reply-To"] = headers["In-Reply-To"]
        if headers.get("References"):
            message["References"] = headers["References"]

        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

        update_body = {"message": {"raw": raw}}
        if thread_id:
            update_body["message"]["threadId"] = thread_id

        result = (
            self.service.users()
            .drafts()
            .update(userId="me", id=draft_id, body=update_body)
            .execute()
        )

        return {
            "draft_id": result["id"],
            "message_id": result["message"]["id"],
            "thread_id": result["message"].get("threadId"),
        }


    # ---------------------------------------------------------------------------
    # Trash & Delete Operations
    # ---------------------------------------------------------------------------

    def trash_bulk_messages(self, message_ids: List[str]) :
        """Moves multiple messages to Trash via batchModify."""
        return self.service.users().messages().batchModify(
            userId="me",
            body={
                "ids": message_ids,
                "addLabelIds": ["TRASH"]
            }
        ).execute()

    def trash_message(self, message_id: str) :
        """Moves a single message to Trash."""
        return self.service.users().messages().trash(
            userId="me",
            id=message_id
        ).execute()

    def delete_bulk_messages(self, message_ids: List[str]) :
        """Permanently deletes multiple messages."""
        return self.service.users().messages().batchDelete(
            userId="me",
            body={"ids": message_ids}
        ).execute()

    def delete_message(self, message_id: str):
        """Permanently deletes a single message (fixed body parameter error)."""
        return self.service.users().messages().delete(
            userId="me",
            id=message_id
        ).execute()

    def untrash_bulk_messages(self, message_ids: List[str]) :
        """Restores multiple messages from Trash by removing the TRASH label."""
        return self.service.users().messages().batchModify(
            userId="me",
            body={
                "ids": message_ids,
                "removeLabelIds": ["TRASH"]
            }
        ).execute()

    def untrash_message(self, message_id: str) :
        """Restores a single message from Trash back to its prior state."""
        return self.service.users().messages().untrash(
            userId="me",
            id=message_id
        ).execute()

    # ---------------------------------------------------------------------------
    # Label & Message State Operations (Read, Star, Archive)
    # ---------------------------------------------------------------------------

    def mark_bulk_as_read(self, message_ids: List[str]) :
        """Marks specified messages as read by removing the UNREAD label."""
        return self.service.users().messages().batchModify(
            userId="me",
            body={
                "ids": message_ids,
                "removeLabelIds": ["UNREAD"]
            }
        ).execute()

    

    def toggle_read_status(self, message_id: str) :
        """
        Toggle the read/unread status of a Gmail message.
        """

        # Get the current labels of the message
        message = self.service.users().messages().get(
            userId="me",
            id=message_id,
            format="minimal"
        ).execute()

        labels = message.get("labelIds", [])

        if "UNREAD" in labels:
            # Message is unread -> mark as read
            body = {
                "removeLabelIds": ["UNREAD"]
            }
            status = "read"
        else:
            # Message is read -> mark as unread
            body = {
                "addLabelIds": ["UNREAD"]
            }
            status = "unread"

        self.service.users().messages().modify(
            userId="me",
            id=message_id,
            body=body
        ).execute()

        return {
            "message_id": message_id,
            "status": status
        }

    def mark_as_read(self, message_id: str):
        """Marks specified message as read by removing the UNREAD label."""
        return self.service.users().messages().modify(
            userId="me",
            id=message_id,
            body={"removeLabelIds": ["UNREAD"]}
        ).execute()

    def mark_bulk_as_unread(self, message_ids: List[str]):
        """Marks specified messages as unread by adding the UNREAD label."""
        return self.service.users().messages().batchModify(
            userId="me",
            body={
                "ids": message_ids,
                "addLabelIds": ["UNREAD"]
            }
        ).execute()

    def mark_as_unread(self, message_id: str):
        """Marks specified message as unread by adding the UNREAD label."""
        return self.service.users().messages().modify(
            userId="me",
            id=message_id,
            body={"addLabelIds": ["UNREAD"]}
        ).execute()

    def star_bulk_messages(self, message_ids: List[str]):
        """Stars specified messages by adding the STARRED label."""
        return self.service.users().messages().batchModify(
            userId="me",
            body={
                "ids": message_ids,
                "addLabelIds": ["STARRED"]
            }
        ).execute()

    def star_message(self, message_id: str):
        """Stars specified message by adding the STARRED label."""
        return self.service.users().messages().modify(
            userId="me",
            id=message_id,
            body={"addLabelIds": ["STARRED"]}
        ).execute()

    def unstar_bulk_messages(self, message_ids: List[str]):
        """Unstars specified messages by removing the STARRED label."""
        return self.service.users().messages().batchModify(
            userId="me",
            body={
                "ids": message_ids,
                "removeLabelIds": ["STARRED"]
            }
        ).execute()

    def unstar_message(self, message_id: str):
        """Unstars specified message by removing the STARRED label."""
        return self.service.users().messages().modify(
            userId="me",
            id=message_id,
            body={"removeLabelIds": ["STARRED"]}
        ).execute()

    def archive_bulk_messages(self, message_ids: List[str]) :
        """Archives messages by removing them from the INBOX."""
        return self.service.users().messages().batchModify(
            userId="me",
            body={
                "ids": message_ids,
                "removeLabelIds": ["INBOX"]
            }
        ).execute()

    def archive_message(self, message_id: str) :
        """Archives message by removing it from the INBOX."""
        return self.service.users().messages().modify(
            userId="me",
            id=message_id,
            body={"removeLabelIds": ["INBOX"]}
        ).execute()

    def unarchive_bulk_messages(self, message_ids: List[str]) :
        """Unarchives messages by restoring them back to the INBOX."""
        return self.service.users().messages().batchModify(
            userId="me",
            body={
                "ids": message_ids,
                "addLabelIds": ["INBOX"]
            }
        ).execute()

    def unarchive_message(self, message_id: str) :
        """Unarchives message by restoring it back to the INBOX."""
        return self.service.users().messages().modify(
            userId="me",
            id=message_id,
            body={"addLabelIds": ["INBOX"]}
        ).execute()

    # ---------------------------------------------------------------------------
    # Spam / Not Spam Operations
    # ---------------------------------------------------------------------------

    def mark_as_spam(self, message_id: str) :
        """Moves a single message to SPAM and removes it from INBOX."""
        return self.service.users().messages().modify(
            userId="me",
            id=message_id,
            body={
                "addLabelIds": ["SPAM"],
                "removeLabelIds": ["INBOX"]
            }
        ).execute()

    def mark_as_not_spam(self, message_id: str) :
        """Removes a single message from SPAM and restores it to INBOX."""
        return self.service.users().messages().modify(
            userId="me",
            id=message_id,
            body={
                "addLabelIds": ["INBOX"],
                "removeLabelIds": ["SPAM"]
            }
        ).execute()

    def bulk_mark_as_spam(self, message_ids: List[str]) :
        """Moves multiple messages to SPAM in a single request."""
        return self.service.users().messages().batchModify(
            userId="me",
            body={
                "ids": message_ids,
                "addLabelIds": ["SPAM"],
                "removeLabelIds": ["INBOX"]
            }
        ).execute()

    def bulk_mark_as_not_spam(self, message_ids: List[str]) :
        """Removes multiple messages from SPAM and restores them to INBOX."""
        return self.service.users().messages().batchModify(
            userId="me",
            body={
                "ids": message_ids,
                "addLabelIds": ["INBOX"],
                "removeLabelIds": ["SPAM"]
            }
        ).execute()

    def get_latest_history_id(self) -> str:
        """Returns the latest Gmail historyId for the account."""
        response = (
            self.service.users()
            .messages()
            .list(
                userId="me",
                maxResults=1
            )
            .execute()
        )

        messages = response.get("messages", [])

        if not messages:
            return None

        message = (
            self.service.users()
            .messages()
            .get(
                userId="me",
                id=messages[0]["id"],
                format="minimal"
            )
            .execute()
        )

        return message.get("historyId")



    def get_messages_since_history_id(self, start_history_id: str):
        response = (
        self.service.users()
        .history()
        .list(
            userId="me",
            startHistoryId=start_history_id,
            historyTypes=["messageAdded"]
        )
        .execute()
    )

        history = response.get("history", [])

        emails = []
        seen = set()

        for item in history:
            for added in item.get("messagesAdded", []):

                message_id = added["message"]["id"]

                if message_id in seen:
                    continue

                seen.add(message_id)

                gmail_message = self.get_message(message_id)

                emails.append(Short_email_parser(gmail_message))

        return emails


    def auto_reply_send(self, message_id: str,email: ReplyEmail, reply_all: bool = False,):
        """
        Sends an immediate reply to an existing Gmail message.

        Args:
            message_id: Gmail message ID to reply to.
            email: ReplyEmail object containing only the reply body.
            reply_all: Whether to reply to all recipients.
        """

        # Fetch original message context
        context = self._get_original_context(message_id)

        # Build recipients
        to_recipients, cc_recipients = self._build_reply_recipients(
            context,
            reply_all=reply_all,
        )

        # Subject
        subject = context["subject"] or ""
        if not subject.lower().startswith("re:"):
            subject = f"Re: {subject}"

        # Build MIME message
        message = MIMEText(email.body, "plain", "utf-8")

        message["To"] = ", ".join(r.email for r in to_recipients)

        if cc_recipients:
            message["Cc"] = ", ".join(r.email for r in cc_recipients)

        message["Subject"] = subject

        # Threading headers
        if context.get("message_id_header"):
            message["In-Reply-To"] = context["message_id_header"]
            message["References"] = context["message_id_header"]

        # Encode
        raw = base64.urlsafe_b64encode(
            message.as_bytes()
        ).decode()

        body = {
            "raw": raw,
            "threadId": context["thread_id"],
        }

        # Send
        return self.service.users().messages().send(
            userId="me",
            body=body,
        ).execute()