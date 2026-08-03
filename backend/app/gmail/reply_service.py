# ---------------------------------------------------------------------------
# NEW FILE: app/gmail/reply_service.py
#
# Mirrors the exact pattern already used in draft_service.py — same
# refresh-token DB lookup, same GmailService construction — just factored
# into one shared helper instead of repeating it in every function.
# ---------------------------------------------------------------------------

import os
import base64

from dotenv import load_dotenv
from sqlalchemy import text

from app.chatbot.agent.objects import DraftEmail, EmailRecipient
from app.database.database import SessionLocal
from app.gmail.gmail_service import GmailService

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")


def _get_gmail_service(user_id: int) -> GmailService:
    db = SessionLocal()
    query = text("""
        SELECT refresh_token FROM gmail_accounts
        WHERE user_id = :user_id
    """)
    result = db.execute(query, {"user_id": user_id}).mappings().first()
    db.close()

    return GmailService(
        refresh_token=result["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
    )


def reply_to_email(message_id: str, user_id: int, body: str, reply_all: bool, attachments=None):
    """Send a reply to an existing Gmail message for the given user."""
    gmail = _get_gmail_service(user_id)
    return gmail.send_reply(
        original_message_id=message_id,
        body=body,
        reply_all=reply_all,
        attachments=attachments,
    )


def forward_email(message_id: str, user_id: int, to, body: str, attachments=None):
    """Forward an existing Gmail message to one or more recipients."""
    gmail = _get_gmail_service(user_id)
    return gmail.send_forward(
        original_message_id=message_id,
        to=to,
        body=body,
        attachments=attachments,
    )


def send_email(user_id: int, subject: str, body: str, to, cc=None, bcc=None, attachments=None):
    """Send a brand-new email immediately."""
    gmail = _get_gmail_service(user_id)

    def _normalize_recipients(values):
        normalized = []
        for value in values or []:
            if isinstance(value, EmailRecipient):
                normalized.append(value)
            elif isinstance(value, dict):
                normalized.append(EmailRecipient(**value))
            else:
                normalized.append(EmailRecipient(email=str(value), name=None))
        return normalized

    draft = DraftEmail(
        subject=subject,
        body=body,
        tone="professional",
        to=_normalize_recipients(to),
        cc=_normalize_recipients(cc),
        bcc=_normalize_recipients(bcc),
        attachments=attachments or [],
    )

    message = gmail._build_message(draft)
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    return gmail.send_message({"raw": raw})


def create_reply_draft(message_id: str, user_id: int, mode: str, body: str, reply_all: bool, to=None, attachments=None):
    """Create a draft reply or forward for an existing Gmail message."""
    gmail = _get_gmail_service(user_id)
    result = gmail.create_reply_draft(
        mode=mode,
        original_message_id=message_id,
        body=body,
        reply_all=reply_all,
        to=to,
        attachments=attachments,
    )
    return {
        "id": result["message_id"],  # <- this is what the frontend stores as draftId
        "draft_id": result["draft_id"],
        "thread_id": result["thread_id"],
    }


# ---------------------------------------------------------------------------
# REPLACES `update_reply_draft` in app/gmail/reply_service.py
# (reply_to_email, forward_email, create_reply_draft stay exactly as before)
# ---------------------------------------------------------------------------

def update_reply_draft(message_id: str, user_id: int, body: str, to=None, attachments=None):
    """Update an in-progress Gmail reply or forward draft."""
    gmail = _get_gmail_service(user_id)
    result = gmail.update_reply_draft(
        draft_message_id=message_id,
        body=body,
        to=to,
        attachments=attachments,
    )
    return {
        "id": result["message_id"],
        "draft_id": result["draft_id"],
        "thread_id": result["thread_id"],
    }