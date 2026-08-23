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
    manage_star_status as _manage_star_status,
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
from app.database.ai_action_service import log_ai_email_action
from app.search.search_service import search_gmail as _search_gmail
from app.preferences.preferences_service import (
    getPreferences as _getPreferences,
    add_preference as _add_preference,
    update_preference as _update_preference,
    toggle_preference_status as _toggle_preference_status,
    delete_preference as _delete_preference,
)
from app.preferences.DTO import UserPreference

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
def get_preferences(user_id: int):
    """Read the current preference settings for the user so the assistant can adapt behavior."""
    return _getPreferences(user_id=user_id)


@tool
def add_preference(user_id: int, preference_name: str, preference_value, enabled: bool = True):
    """Create a new user preference for the assistant."""
    return _add_preference(
        user_id=user_id,
        preference=UserPreference(
            preference_name=preference_name,
            preference_value=preference_value,
            enabled=enabled,
        ),
    )


@tool
def update_preference(preference_id: int, user_id: int, preference_name: str, preference_value, enabled: bool = True):
    """Update an existing user preference for the assistant."""
    return _update_preference(
        preference_id=preference_id,
        user_id=user_id,
        preference=UserPreference(
            preference_name=preference_name,
            preference_value=preference_value,
            enabled=enabled,
        ),
    )


@tool
def toggle_preference_status(preference_id: int, user_id: int, enabled: bool):
    """Enable or disable an existing user preference."""
    return _toggle_preference_status(preference_id=preference_id, user_id=user_id, enabled=enabled)


@tool
def delete_preference(preference_id: int, user_id: int):
    """Delete a user preference."""
    return _delete_preference(preference_id=preference_id, user_id=user_id)


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
def get_user_details(user_id: int):
    """Return the current user's name and email from the local account record for personalization and reply context."""
    db = SessionLocal()
    user_row = db.execute(
        text("SELECT name, email FROM users WHERE id = :id"),
        {"id": user_id},
    ).mappings().first()
    db.close()

    if not user_row:
        return {
            "name": "",
            "email": "",
            "found": False,
        }

    return {
        "name": user_row["name"],
        "email": user_row["email"],
        "found": True,
    }


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
    try:
            draft_result = _genAI_draft(request=request, user_id=user_id, user_details=user_details) if mode == "ai" else _gen_draft(request=request, user_id=user_id)
    except Exception as error:
        log_ai_email_action(
            user_id=user_id,
            action_type="draft_created",
            status="failed",
            input_text=body or "",
            error_message=str(error),
            metadata={"mode": mode, "subject": subject, "recipients": recipients or [], "cc": cc or [], "bcc": bcc or []},
        )
        raise

    gmail_message_id = (draft_result.get("message", {}) or {}).get("id") or draft_result.get("message_id")
    log_ai_email_action(
        user_id=user_id,
        action_type="draft_created",
        status="completed",
        input_text=body or "",
        output_text=str(draft_result),
        metadata={"mode": mode, "subject": subject, "recipients": recipients or [], "cc": cc or [], "bcc": bcc or []},
        email_id=gmail_message_id,
    )

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
    try:
        result = _update_draft(message_id=message_id, draft=draft, user_id=user_id)
    except Exception as error:
        log_ai_email_action(
            user_id=user_id,
            action_type="draft_updated",
            status="failed",
            input_text=subject or "",
            error_message=str(error),
            metadata={"message_id": message_id, "subject": subject, "to": to or [], "cc": cc or [], "bcc": bcc or []},
        )
        raise

    log_ai_email_action(
        user_id=user_id,
        action_type="draft_updated",
        status="completed",
        input_text=subject or "",
        output_text=str(result),
        metadata={"message_id": message_id, "subject": subject, "to": to or [], "cc": cc or [], "bcc": bcc or []},
        email_id=message_id,
    )
    return result


@tool
def send_draft(message_id: str, user_id: int):
    """Send an existing Gmail draft by its message id."""
    return _send_draft(message_id=message_id, user_id=user_id)


@tool
def delete_draft(message_id: str, user_id: int):
    """Delete an existing Gmail draft."""
    return _delete_draft(message_id=message_id, user_id=user_id)


@tool
def reply_to_email(message_id: str, user_id: int, body: str, reply_all: bool, attachments=None):
    """Send a reply to an existing Gmail message for the given user."""
    result = _reply_to_email(message_id=message_id, user_id=user_id, body=body, reply_all=reply_all, attachments=attachments)
    log_ai_email_action(
        user_id=user_id,
        action_type="reply_generated",
        status="completed",
        input_text=body,
        output_text=str(result),
        metadata={"message_id": message_id, "reply_all": reply_all},
        email_id=message_id,
    )
    return result


@tool
def forward_email(message_id: str, user_id: int, to, body: str, attachments=None):
    """Forward an existing Gmail message to one or more recipients."""
    result = _forward_email(message_id=message_id, user_id=user_id, to=to, body=body, attachments=attachments)
    log_ai_email_action(
        user_id=user_id,
        action_type="reply_generated",
        status="completed",
        input_text=body,
        output_text=str(result),
        metadata={"message_id": message_id, "recipients": to},
        email_id=message_id,
    )
    return result


@tool
def send_email(user_id: int, subject: str, body: str, to, cc=None, bcc=None, attachments=None):
    """Send a new email immediately."""
    result = _send_email(user_id=user_id, subject=subject, body=body, to=to, cc=cc, bcc=bcc, attachments=attachments)
    log_ai_email_action(
        user_id=user_id,
        action_type="email_sent",
        status="completed",
        input_text=body,
        output_text=str(result),
        metadata={"subject": subject, "to": to, "cc": cc or [], "bcc": bcc or []},
    )
    return result


@tool
def create_reply_draft(message_id: str, user_id: int, mode: str, body: str, reply_all: bool, to=None, attachments=None):
    """Create a draft reply or forward for an existing Gmail message."""
    try:
        result = _create_reply_draft(message_id=message_id, user_id=user_id, mode=mode, body=body, reply_all=reply_all, to=to, attachments=attachments)
    except Exception as error:
        log_ai_email_action(
            user_id=user_id,
            action_type="draft_created",
            status="failed",
            input_text=body,
            error_message=str(error),
            metadata={"message_id": message_id, "mode": mode, "reply_all": reply_all},
        )
        raise

    log_ai_email_action(
        user_id=user_id,
        action_type="draft_created",
        status="completed",
        input_text=body,
        output_text=str(result),
        metadata={"message_id": message_id, "mode": mode, "reply_all": reply_all},
        email_id=message_id,
    )
    return result


@tool
def update_reply_draft(message_id: str, user_id: int, body: str, to=None, attachments=None):
    """Update an in-progress Gmail reply or forward draft."""
    try:
        result = _update_reply_draft(message_id=message_id, user_id=user_id, body=body, to=to, attachments=attachments)
    except Exception as error:
        log_ai_email_action(
            user_id=user_id,
            action_type="draft_updated",
            status="failed",
            input_text=body,
            error_message=str(error),
            metadata={"message_id": message_id},
        )
        raise

    log_ai_email_action(
        user_id=user_id,
        action_type="draft_updated",
        status="completed",
        input_text=body,
        output_text=str(result),
        metadata={"message_id": message_id},
        email_id=message_id,
    )
    return result


@tool
def get_Inbox(user_id: int, max_results: int = 100):
    """Fetch the most recent Gmail messages for the given user."""
    return _get_Inbox(user_id=user_id, max_results=max_results)


@tool
def search_gmail(user_id: int, query: str, limit: int = 20):
    """Search the user's Gmail inbox for emails matching a query."""
    return _search_gmail(user_id=user_id, query=query, limit=limit)


@tool
def trashBunch(user_id: int, message_ids: list[str]):
    """Move multiple Gmail messages to trash."""
    result = _trashBunch(user_id=user_id, request=MessageIdsRequest(message_ids=message_ids))
    log_ai_email_action(
        user_id=user_id,
        action_type="email_trashed",
        status="completed",
        input_text=",".join(message_ids),
        output_text=str(result),
        metadata={"message_ids": message_ids, "scope": "bulk"},
    )
    return result


@tool
def deleteBunch(user_id: int, message_ids: list[str]):
    """Delete multiple Gmail messages permanently."""
    result = _deleteBunch(user_id=user_id, request=MessageIdsRequest(message_ids=message_ids))
    log_ai_email_action(
        user_id=user_id,
        action_type="email_deleted",
        status="completed",
        input_text=",".join(message_ids),
        output_text=str(result),
        metadata={"message_ids": message_ids, "scope": "bulk"},
    )
    return result


@tool
def manage_star_status(user_id: int, message_id: str, star_status:bool):
    """Star or unstar a Gmail message."""
    result = _manage_star_status(user_id=user_id, message_id=message_id, star_status=star_status)
    log_ai_email_action(
        user_id=user_id,
        action_type="email_starred" if star_status else "email_unstarred",
        status="completed",
        input_text=message_id,
        output_text=str(result),
        metadata={"message_id": message_id, "star_status": star_status},
        email_id=message_id,
    )
    return result


@tool
def read_status(user_id: int, message_id: str):
    """Toggle a Gmail message read state."""
    result = _read_status(user_id=user_id, message_id=message_id)
    log_ai_email_action(
        user_id=user_id,
        action_type="email_read_toggled",
        status="completed",
        input_text=message_id,
        output_text=str(result),
        metadata={"message_id": message_id},
        email_id=message_id,
    )
    return result


@tool
def archive(user_id: int, message_id: str):
    """Archive a Gmail message."""
    result = _archive(user_id=user_id, message_id=message_id)
    log_ai_email_action(
        user_id=user_id,
        action_type="email_archived",
        status="completed",
        input_text=message_id,
        output_text=str(result),
        metadata={"message_id": message_id},
        email_id=message_id,
    )
    return result


@tool
def untrash(user_id: int, message_id: str):
    """Restore a Gmail message from trash."""
    result = _untrash(user_id=user_id, message_id=message_id)
    log_ai_email_action(
        user_id=user_id,
        action_type="email_untrashed",
        status="completed",
        input_text=message_id,
        output_text=str(result),
        metadata={"message_id": message_id},
        email_id=message_id,
    )
    return result


@tool
def markspam(user_id: int, message_id: str):
    """Mark a Gmail message as spam."""
    result = _markspam(user_id=user_id, message_id=message_id)
    log_ai_email_action(
        user_id=user_id,
        action_type="email_marked_spam",
        status="completed",
        input_text=message_id,
        output_text=str(result),
        metadata={"message_id": message_id},
        email_id=message_id,
    )
    return result


@tool
def mark_not_spam(user_id: int, message_id: str):
    """Mark a Gmail message as not spam."""
    result = _mark_not_spam(user_id=user_id, message_id=message_id)
    log_ai_email_action(
        user_id=user_id,
        action_type="email_marked_not_spam",
        status="completed",
        input_text=message_id,
        output_text=str(result),
        metadata={"message_id": message_id},
        email_id=message_id,
    )
    return result


@tool
def delete(user_id: int, message_id: str):
    """Delete a Gmail message permanently."""
    result = _delete(user_id=user_id, message_id=message_id)
    log_ai_email_action(
        user_id=user_id,
        action_type="email_deleted",
        status="completed",
        input_text=message_id,
        output_text=str(result),
        metadata={"message_id": message_id},
        email_id=message_id,
    )
    return result


@tool
def trashOne(user_id: int, message_id: str):
    """Move one Gmail message to trash."""
    result = _trashOne(user_id=user_id, message_id=message_id)
    log_ai_email_action(
        user_id=user_id,
        action_type="email_trashed",
        status="completed",
        input_text=message_id,
        output_text=str(result),
        metadata={"message_id": message_id},
        email_id=message_id,
    )
    return result

knowledge_tools = [retrieval_from_docs, get_embed_docs, delete_doc, get_preferences, add_preference, update_preference, toggle_preference_status, delete_preference]

gmail_tools = [getEmail, get_Draft, get_Sent, get_user_details, draft_Sent, create_draft, update_draft, send_draft, delete_draft, send_email, reply_to_email, forward_email, create_reply_draft, update_reply_draft, get_Inbox, search_gmail, get_preferences, add_preference, update_preference, toggle_preference_status, delete_preference, trashBunch, deleteBunch, manage_star_status, read_status, archive, untrash, markspam, mark_not_spam, delete, trashOne]
