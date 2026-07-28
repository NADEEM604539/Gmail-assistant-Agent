import os

from dotenv import load_dotenv
from sqlalchemy import text

from app.chatbot.agent.llm.llm_output_parsers import generateDraft as llmDraft
from app.database.database import SessionLocal
from app.gmail.DTO import DraftRequest
from app.gmail.gmail_service import GmailService

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")


def get_Draft(user_id : int, max_results=100):
    db = SessionLocal()
    query = text("""
    SELECT refresh_token FROM gmail_accounts
    WHERE user_id = :user_id
""")

    result = db.execute(query, {"user_id": user_id}).mappings().first()

    gmail = GmailService(
        refresh_token=result["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )

    messages = gmail.fetch_latest_emails(max_results=max_results, label="DRAFT")
    db.close()
    return messages

def _normalize_request_to_draft(request: DraftRequest):
    if request.mode == "ai":
        email = llmDraft(request=request)
        return email

    from app.chatbot.agent.objects import DraftEmail

    recipients = []
    for email in request.to or []:
        recipients.append({"email": email})

    return DraftEmail(
        subject=request.subject or "Draft",
        body=request.body or "",
        tone="professional",
        to=recipients,
        cc=[{"email": email} for email in request.cc or []],
        bcc=[{"email": email} for email in request.bcc or []],
    )


def update_draft(message_id: str, draft, user_id: int):
    db = SessionLocal()
    query = text("""
    SELECT refresh_token FROM gmail_accounts
    WHERE user_id = :user_id
    """)

    result = db.execute(query, {"user_id": user_id}).mappings().first()

    gmail = GmailService(
        refresh_token=result["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
    )
    draft_id = gmail.get_draft_id(message_id=message_id)
    result = gmail.update_draft(draft_id=draft_id, draft=draft)
    db.close()
    print(result)
    return result


def send_draft(message_id: str, user_id: int):
    db = SessionLocal()
    query = text("""
    SELECT refresh_token FROM gmail_accounts
    WHERE user_id = :user_id
""")

    result = db.execute(query, {"user_id": user_id}).mappings().first()

    gmail = GmailService(
        refresh_token=result["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
    )
    draft_id = gmail.get_draft_id(message_id=message_id)
    response = gmail.send_draft(draft_id=draft_id)
    print(response)
    db.close()
    return response


def delete_draft(message_id: str, user_id: int):
    db = SessionLocal()
    query = text("""
    SELECT refresh_token FROM gmail_accounts
    WHERE user_id = :user_id
""")

    result = db.execute(query, {"user_id": user_id}).mappings().first()

    gmail = GmailService(
        refresh_token=result["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
    )
    draft_id = gmail.get_draft_id(message_id=message_id)
    response = gmail.delete_draft(draft_id=draft_id)
    db.close()
    return response


def genAI_draft(request: DraftRequest, user_id: int):
    db = SessionLocal()
    query = text("""
    SELECT refresh_token FROM gmail_accounts
    WHERE user_id = :user_id
""")

    result = db.execute(query, {"user_id": user_id}).mappings().first()

    email = llmDraft(request=request)
    gmail = GmailService(
        refresh_token=result["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )
    draft_email = gmail.create_draft(email)
    db.close()
    print(draft_email)
    return draft_email


def gen_draft(request: DraftRequest, user_id: int):
    db = SessionLocal()
    query = text("""
    SELECT refresh_token FROM gmail_accounts
    WHERE user_id = :user_id
""")

    result = db.execute(query, {"user_id": user_id}).mappings().first()

    gmail = GmailService(
        refresh_token=result["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )
    draft_email = gmail.create_draft(_normalize_request_to_draft(request))
    db.close()
    return draft_email
