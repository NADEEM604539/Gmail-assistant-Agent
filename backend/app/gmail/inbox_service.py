from dotenv import load_dotenv
import os
from app.gmail.gmail_service import GmailService
from sqlalchemy import text
from app.database.database import SessionLocal
load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")


def get_Inbox(user_id : int, max_results=100):
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

    messages = gmail.fetch_latest_emails(max_results=max_results)
    db.close()
    return messages