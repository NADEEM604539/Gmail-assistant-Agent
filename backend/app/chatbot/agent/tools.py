import os

from dotenv import load_dotenv
from app.embeddings.embed_service import get_embed_docs as _get_embed_docs, delete_doc as _delete_doc
from app.gmail.gmail import getEmail as _getEmail
from app.database.database import SessionLocal
from sqlalchemy import text
from app.gmail.draft_service import (
    get_Draft as _get_Draft,
    genAI_draft as _genAI_draft,
    gen_draft as _gen_draft,
    update_draft as _update_draft,
    send_draft as _send_draft,
    delete_draft as _delete_draft,
)
from app.gmail.sent_service import get_Sent as _get_Sent, draft_Sent as _draft_Sent
from app.gmail.DTO import MessageIdsRequest
from app.gmail.DTO import DraftRequest, User
from app.gmail.reply_service import (
    reply_to_email as _reply_to_email,
    forward_email as _forward_email,
    send_email as _send_email,
    create_reply_draft as _create_reply_draft,
    update_reply_draft as _update_reply_draft,
)
from app.gmail.inbox_service import (
    get_Inbox as _get_Inbox,
    trashBunch as _trashBunch,
    deleteBunch as _deleteBunch,
    star_status as _star_status,
    read_status as _read_status,
    archive as _archive,
    untrash as _untrash,
    markspam as _markspam,
    mark_not_spam as _mark_not_spam,
    delete as _delete,
    trashOne as _trashOne,
)
from app.chatbot.agent.retrieval.retrieval_from_docs import retrieval_from_docs
from langchain.tools import tool
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


def _draft_has_recipients(gmail: GmailService, draft_id: str) -> bool:
    draft = (
        gmail.service.users()
        .drafts()
        .get(userId="me", id=draft_id, format="full")
        .execute()
    )
    headers = {
        header.get("name", "").lower(): header.get("value", "")
        for header in draft.get("message", {}).get("payload", {}).get("headers", [])
    }
    return bool(headers.get("to") or headers.get("cc") or headers.get("bcc"))


@tool
def get_embed_docs(user_id: int):
    """List uploaded documents for the given user."""
    return _get_embed_docs(user_id=user_id)


@tool
def delete_doc(user_id: int, doc_id: int):
    """Delete a document and its embeddings."""
    return _delete_doc(user_id=user_id, doc_id=doc_id)


@tool
def getEmail(user_id: int, message_id: str):
    """Fetch a Gmail message by id."""
    return _getEmail(user_id=user_id, message_id=message_id)


@tool
def get_Draft(user_id: int, max_results: int = 100):
    """Fetch the most recent draft emails for the given user."""
    return _get_Draft(user_id=user_id, max_results=max_results)


@tool
def get_Sent(user_id: int, max_results: int = 10):
    """Fetch the most recent sent Gmail messages."""
    return _get_Sent(user_id=user_id, max_results=max_results)


@tool
def draft_Sent(user_id: int, message_id: str, draft):
    """Send an updated Gmail draft as a message."""
    return _draft_Sent(user_id=user_id, message_id=message_id, draft=draft)


@tool
def create_draft(user_id: int, mode: str, subject: str = None, body: str = None, tone: str = None, recipients: list[str] | None = None, cc: list[str] | None = None, bcc: list[str] | None = None, context: str = None, target_word_count: int = None, topic: str = None):
    """Create a new Gmail draft for the given user."""
    request = DraftRequest(
        mode=mode,
        subject=subject,
        body=body,
        tone=tone,
        recipients=recipients,
        cc=cc,
        bcc=bcc,
        context=context,
        target_word_count=target_word_count,
        topic=topic,
    )
    db = SessionLocal()
    user_row = db.execute(
        text("SELECT name, email FROM users WHERE id = :id"),
        {"id": user_id},
    ).mappings().first()
    db.close()

    user_details = User(
        name=user_row["name"] if user_row else "",
        email=user_row["email"] if user_row else "",
    )
    draft_result = _genAI_draft(request=request, user_id=user_id, user_details=user_details) if mode == "ai" else _gen_draft(request=request, user_id=user_id)

    return {
        "id": draft_result.get("id") or draft_result.get("draft_id"),
        "draft_id": draft_result.get("id") or draft_result.get("draft_id"),
        "message_id": draft_result.get("message", {}).get("id") or draft_result.get("message_id"),
        "thread_id": draft_result.get("message", {}).get("threadId") or draft_result.get("thread_id"),
        "raw": draft_result,
    }


@tool
def update_draft(message_id: str, user_id: int, subject: str = None, body: str = None, to: list[str] | None = None, cc: list[str] | None = None, bcc: list[str] | None = None):
    """Update an existing Gmail draft."""
    from app.chatbot.agent.objects import DraftEmail

    draft = DraftEmail(
        subject=subject or "Draft",
        body=body or "",
        tone="professional",
        to=[{"email": email} for email in (to or [])],
        cc=[{"email": email} for email in (cc or [])],
        bcc=[{"email": email} for email in (bcc or [])],
    )
    return _update_draft(message_id=message_id, draft=draft, user_id=user_id)


@tool
def send_draft(user_id: int, draft_id: str = None, message_id: str = None):
    """Send an existing Gmail draft using draft_id when available."""
    gmail = _get_gmail_service(user_id)

    if draft_id:
        if not _draft_has_recipients(gmail, draft_id):
            return {
                "success": False,
                "error": "Draft has no recipient address. Add at least one To, Cc, or Bcc recipient before sending.",
            }

        try:
            return gmail.send_draft(draft_id=draft_id)
        except Exception as error:
            return {
                "success": False,
                "error": f"Gmail rejected the draft: {str(error)}",
            }

    if message_id:
        try:
            return _send_draft(message_id=message_id, user_id=user_id)
        except Exception as error:
            return {
                "success": False,
                "error": f"Gmail rejected the draft: {str(error)}",
            }

    raise ValueError("Either draft_id or message_id must be provided.")


@tool
def delete_draft(message_id: str, user_id: int):
    """Delete an existing Gmail draft."""
    return _delete_draft(message_id=message_id, user_id=user_id)


@tool
def reply_to_email(message_id: str, user_id: int, body: str, reply_all: bool, attachments=None):
    """Send a reply to an existing Gmail message for the given user."""
    return _reply_to_email(message_id=message_id, user_id=user_id, body=body, reply_all=reply_all, attachments=attachments)


@tool
def forward_email(message_id: str, user_id: int, to, body: str, attachments=None):
    """Forward an existing Gmail message to one or more recipients."""
    return _forward_email(message_id=message_id, user_id=user_id, to=to, body=body, attachments=attachments)


@tool
def send_email(user_id: int, subject: str, body: str, to, cc=None, bcc=None, attachments=None):
    """Send a new email immediately."""
    return _send_email(user_id=user_id, subject=subject, body=body, to=to, cc=cc, bcc=bcc, attachments=attachments)


@tool
def create_reply_draft(message_id: str, user_id: int, mode: str, body: str, reply_all: bool, to=None, attachments=None):
    """Create a draft reply or forward for an existing Gmail message."""
    return _create_reply_draft(message_id=message_id, user_id=user_id, mode=mode, body=body, reply_all=reply_all, to=to, attachments=attachments)


@tool
def update_reply_draft(message_id: str, user_id: int, body: str, to=None, attachments=None):
    """Update an in-progress Gmail reply or forward draft."""
    return _update_reply_draft(message_id=message_id, user_id=user_id, body=body, to=to, attachments=attachments)


@tool
def get_Inbox(user_id: int, max_results: int = 100):
    """Fetch the most recent Gmail messages for the given user."""
    return _get_Inbox(user_id=user_id, max_results=max_results)


@tool
def trashBunch(user_id: int, message_ids: list[str]):
    """Move multiple Gmail messages to trash."""
    return _trashBunch(user_id=user_id, request=MessageIdsRequest(message_ids=message_ids))


@tool
def deleteBunch(user_id: int, message_ids: list[str]):
    """Delete multiple Gmail messages permanently."""
    return _deleteBunch(user_id=user_id, request=MessageIdsRequest(message_ids=message_ids))


@tool
def star_status(user_id: int, message_id: str):
    """Star a Gmail message."""
    return _star_status(user_id=user_id, message_id=message_id)


@tool
def read_status(user_id: int, message_id: str):
    """Toggle a Gmail message read state."""
    return _read_status(user_id=user_id, message_id=message_id)


@tool
def archive(user_id: int, message_id: str):
    """Archive a Gmail message."""
    return _archive(user_id=user_id, message_id=message_id)


@tool
def untrash(user_id: int, message_id: str):
    """Restore a Gmail message from trash."""
    return _untrash(user_id=user_id, message_id=message_id)


@tool
def markspam(user_id: int, message_id: str):
    """Mark a Gmail message as spam."""
    return _markspam(user_id=user_id, message_id=message_id)


@tool
def mark_not_spam(user_id: int, message_id: str):
    """Mark a Gmail message as not spam."""
    return _mark_not_spam(user_id=user_id, message_id=message_id)


@tool
def delete(user_id: int, message_id: str):
    """Delete a Gmail message permanently."""
    return _delete(user_id=user_id, message_id=message_id)


@tool
def trashOne(user_id: int, message_id: str):
    """Move one Gmail message to trash."""
    return _trashOne(user_id=user_id, message_id=message_id)

knowledge_tools = [retrieval_from_docs, get_embed_docs, delete_doc]

gmail_tools = [getEmail, get_Draft, get_Sent, draft_Sent, create_draft, update_draft, send_draft, delete_draft, send_email, reply_to_email, forward_email, create_reply_draft, update_reply_draft, get_Inbox, trashBunch, deleteBunch, star_status, read_status, archive, untrash, markspam, mark_not_spam, delete, trashOne]
