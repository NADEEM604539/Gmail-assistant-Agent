import requests

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import base64
from bs4 import BeautifulSoup
from email.utils import parseaddr
from email.utils import getaddresses
from email.utils import parsedate_to_datetime



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


    def fetch_latest_emails(self, max_results=10):
        response = (
        self.service.users()
        .messages()
        .list(
            userId="me",
            maxResults=max_results,
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
            format_email = self.parse_email(email)
            emails.append(format_email)

        return emails

    def get_headers(self, payload):
        headers = {}

        for header in payload.get("headers", []):
            headers[header["name"]] = header["value"]

        return headers

    def get_email_body(self, payload):
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


    def parse_email(self, email):
    
        headers = {
            h["name"]: h["value"]
            for h in email["payload"].get("headers", [])
        }

        labels = email.get("labelIds", [])

        # --------------------------
        # Sender
        # --------------------------

        from_name, from_email = parseaddr(headers.get("From", ""))

        to_name, to_email = parseaddr(headers.get("To", ""))

        # --------------------------
        # Folder
        # --------------------------

        folder = "inbox"

        if "SENT" in labels:
            folder = "sent"
        elif "DRAFT" in labels:
            folder = "draft"
        elif "SPAM" in labels:
            folder = "spam"
        elif "TRASH" in labels:
            folder = "trash"
        elif "CATEGORY_PROMOTIONS" in labels:
            folder = "promotion"
        elif "CATEGORY_SOCIAL" in labels:
            folder = "social"
        elif "CATEGORY_UPDATES" in labels:
            folder = "updates"

        # --------------------------
        # Status
        # --------------------------

        status = "read"

        if "UNREAD" in labels:
            status = "unread"

        if "DRAFT" in labels:
            status = "draft"

        if "SENT" in labels:
            status = "sent"

        if "TRASH" in labels:
            status = "deleted"

        # --------------------------
        # Category
        # --------------------------

        category = None

        if "CATEGORY_PROMOTIONS" in labels:
            category = "promotion"

        elif "CATEGORY_SOCIAL" in labels:
            category = "social"

        elif "CATEGORY_UPDATES" in labels:
            category = "updates"

        elif "CATEGORY_FORUMS" in labels:
            category = "forums"

        elif "CATEGORY_PERSONAL" in labels:
            category = "primary"

        # --------------------------
        # Attachments
        # --------------------------

        attachments = []

        payload = email.get("payload", {})

        parts = payload.get("parts", [])

        for part in parts:

            body = part.get("body", {})

            if "attachmentId" not in body:
                continue

            attachments.append({
                "content_id": part.get("headers", [{}])[0].get("value"),
                "filename": part.get("filename"),
                "mime_type": part.get("mimeType"),
                "size_bytes": body.get("size"),
                "download_url": body.get("attachmentId"),
                "storage_url": None,
                "checksum": None,
                "is_inline": part.get("filename", "") == ""
            })

        # --------------------------
        # Recipients
        # --------------------------

        recipients = []

        for recipient_type, header in [
            ("to", headers.get("To")),
            ("cc", headers.get("Cc")),
            ("bcc", headers.get("Bcc"))
        ]:

            if not header:
                continue

            for index, (name, address) in enumerate(getaddresses([header])):

                recipients.append({
                    "recipient_type": recipient_type,
                    "name": name,
                    "email": address,
                    "recipient_order": index
                })

        # --------------------------
        # Dates
        # --------------------------

        received_at = None

        if headers.get("Date"):
            try:
                received_at = parsedate_to_datetime(
                    headers["Date"]
                )
            except Exception:
                pass

        return {

            "email": {

                "gmail_message_id": email["id"],
                "gmail_thread_id": email["threadId"],
                "history_id": int(email.get("historyId", 0)),

                "folder": folder,

                "from_name": from_name,
                "from_email": from_email,

                "to_name": to_name,
                "to_email": to_email,

                "subject": headers.get("Subject", ""),

                "body": self.get_email_body(email["payload"]),

                "preview": email.get("snippet"),

                "label": ",".join(labels),

                "category": category,

                "status": status,

                "priority": "medium",

                "has_attachment": len(attachments) > 0,

                "starred": "STARRED" in labels,

                "is_important": "IMPORTANT" in labels,

                "ai_summary": None,

                "received_at": received_at,

                "sent_at": received_at
            },

            "recipients": recipients,

            "attachments": attachments
        }