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
from email import encoders
import mimetypes
import os
from app.gmail.DTO import DraftPayload



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