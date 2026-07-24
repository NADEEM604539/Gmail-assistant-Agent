import requests

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import base64
from bs4 import BeautifulSoup
from email.utils import parseaddr
from email.utils import getaddresses
from email.utils import parsedate_to_datetime
from app.gmail.Parser.cardEmailParser import Card_email_parser
from app.gmail.Parser.shortEmailParser import Short_email_parser



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