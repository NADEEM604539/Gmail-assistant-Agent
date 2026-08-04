from sqlalchemy import text
from dotenv import load_dotenv
import os
from app.gmail.gmail_service import GmailService
from app.auto_reply.filter import filter_and_send_messages
from app.gmail.DTO import User
load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

def reply_mails_by_user(user_id: int, db):

    query = text("""
        SELECT
            refresh_token,
            last_history_id,
            last_auto_reply_check_at,
            TIMESTAMPDIFF(HOUR, last_auto_reply_check_at, NOW()) AS hours_passed
        FROM gmail_accounts
        WHERE user_id = :user_id
    """)

    user = db.execute(
        query,
        {"user_id": user_id}
    ).mappings().first()

    if not user:
        return {
            "success": False,
            "message": "Gmail account not found."
        }

    gmail = GmailService(
        refresh_token=user["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )

    latest_history_id = gmail.get_latest_history_id()

    # First execution or 24 hours have passed
    if (
        user["last_auto_reply_check_at"] is None
        or user["hours_passed"] >= 24
    ):

        update_query = text("""
            UPDATE gmail_accounts
            SET
                last_history_id = :last_history_id,
                last_auto_reply_check_at = NOW()
            WHERE user_id = :user_id
        """)

        db.execute(
            update_query,
            {
                "user_id": user_id,
                "last_history_id": latest_history_id
            }
        )

        db.commit()

        return {
            "success": True,
            "message": "Auto reply baseline initialized.",
            "history_id": latest_history_id
        }

    # -----------------------------------------
    # Less than 24 hours
    # Process new emails
    # -----------------------------------------
    query = text("""
        SELECT name, email FROM users
        WHERE id= :id
""")
    current_user = db.execute(query, {
        "id":user_id
    }).mappings().first()

    user_details = User(
        name= current_user.name,
        email= current_user.email
    )
    filter_and_send_messages(
        gmail= gmail,
        start_history_id=user.last_history_id,
        user_details= user_details,
        user_id= user_id
    )

    # Update history_id after processing
    update_query = text("""
        UPDATE gmail_accounts
        SET last_history_id = :last_history_id, last_auto_reply_check_at = now()
        WHERE user_id = :user_id
    """)

    db.execute(
        update_query,
        {
            "user_id": user_id,
            "last_history_id": latest_history_id
        }
    )

    db.commit()

    return {
        "success": True,
        "message": "Auto replies processed.",
        "history_id": latest_history_id
    }


