from email.utils import parseaddr, parsedate_to_datetime,  getaddresses
import base64
from bs4 import BeautifulSoup

def Short_email_parser( email):
        payload = email["payload"]

        headers = {
            h["name"]: h["value"]
            for h in payload.get("headers", [])
        }

        labels = email.get("labelIds", [])

        sender_name, sender_email = parseaddr(headers.get("From", ""))

        recipients = [
            {
                "name": name,
                "email": address,
                "type": recipient_type,
            }
            for recipient_type, header in [
                ("to", headers.get("To")),
                ("cc", headers.get("Cc")),
                ("bcc", headers.get("Bcc")),
            ]
            if header
            for name, address in getaddresses([header])
        ]

        attachments = []

        for part in payload.get("parts", []):

            body = part.get("body", {})

            if body.get("attachmentId"):
                attachments.append({
                    "filename": part.get("filename"),
                    "mime_type": part.get("mimeType"),
                    "attachment_id": body["attachmentId"],
                    "size": body.get("size"),
                })

        try:
            date = parsedate_to_datetime(headers["Date"])
        except Exception:
            date = None

        return {
            "id": email["id"],
            "thread_id": email["threadId"],
            "history_id": int(email.get("historyId", 0)),

            "subject": headers.get("Subject", ""),
            "body": get_email_body(payload),
            "snippet": email.get("snippet", ""),

            "from": {
                "name": sender_name,
                "email": sender_email,
            },

            "to": recipients,

            "date": date,

            "labels": labels,

            "unread": "UNREAD" in labels,
            "starred": "STARRED" in labels,
            "important": "IMPORTANT" in labels,

            "attachments": attachments,
        }

def get_headers(payload):
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

