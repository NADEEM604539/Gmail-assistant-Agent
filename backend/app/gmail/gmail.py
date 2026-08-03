from dotenv import load_dotenv
import os
from app.gmail.gmail_service import GmailService
from sqlalchemy import text
from app.database.database import SessionLocal
from datetime import datetime
import json
from app.gmail.DTO import AutoReply
from app.gmail.Parser.fullEmailParser import parse_email_full
from app.gmail.Parser.shortEmailParser import Short_email_parser
from langchain.tools import tool


load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

def get_5_emails( user_id : int,query: str, max_results=5):
    db = SessionLocal()
    Query = text("""
    SELECT refresh_token FROM gmail_accounts
    WHERE user_id = :user_id
""")

    result = db.execute(Query, {"user_id": user_id}).mappings().first()

    gmail = GmailService(
        refresh_token=result["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )

    messages = gmail.fetch_emails_by_category(query=query , max_results=max_results)
    db.close()
    return messages

def getEmail(user_id : int, message_id: str):
    """
    Retrieves a Gmail message by its ID, parses it into a structured format, and returns the complete email along with its conversation thread (if available) for the specified user.
    """
    db = SessionLocal()
    Query = text("""
        SELECT refresh_token FROM gmail_accounts
        WHERE user_id = :user_id
    """)
    
    result = db.execute(Query, {"user_id": user_id}).mappings().first()
    gmail = GmailService(
            refresh_token=result["refresh_token"],
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET
        )
    unstructured_mail = gmail.get_message(message_id=message_id)
    mail = parse_email_full(unstructured_mail)

    def sanitize_message(message):
        if not isinstance(message, dict):
            return message

        sanitized = dict(message)
        sanitized.pop("thread_messages", None)
        return sanitized

    if mail.get("thread_id"):
        try:
            thread_messages = gmail.get_thread_messages(mail["thread_id"])
            ordered_messages = []
            seen_ids = set()

            for thread_message in thread_messages:
                message_id_value = thread_message.get("id")
                if not message_id_value or message_id_value in seen_ids:
                    continue

                seen_ids.add(message_id_value)
                if message_id_value == mail.get("id"):
                    ordered_messages.append(sanitize_message(mail))
                else:
                    ordered_messages.append(sanitize_message(thread_message))

            if not ordered_messages:
                ordered_messages = [sanitize_message(mail)]

            mail["thread_messages"] = ordered_messages
        except Exception:
            mail["thread_messages"] = [sanitize_message(mail)]
        finally:
            db.close()
    else:
        mail["thread_messages"] = [sanitize_message(mail)]

    return mail



def get_account(user_id:int):
    db = SessionLocal()
    query = text("""
        SELECT email_address, is_primary, status, auto_reply, connected_at 
        FROM gmail_accounts
        WHERE user_id = :user_id
    """)
    
    result = db.execute(query, {"user_id": user_id}).mappings().first()
    db.close()

    return result

def toggle_auto_reply(user_id: int, auto_reply_status: bool):
    db = SessionLocal()
    try:
        Query = text("""
        SELECT refresh_token FROM gmail_accounts
        WHERE user_id = :user_id
        """)
    
        token = db.execute(Query, {"user_id": user_id}).mappings().first()
        gmail = GmailService(
            refresh_token=token["refresh_token"],
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET
        )
        history_id = gmail.get_latest_history_id()

        query = text("""
            UPDATE gmail_accounts
            SET auto_reply = :reply, last_history_id=:last_history_id, last_auto_reply_check_at = now()
            WHERE user_id = :user_id
        """)
        
        result = db.execute(query, {
            "user_id": user_id,
            "reply": auto_reply_status,
            "last_history_id":history_id
        })
        
        db.commit()
        
        # Check if a row was actually updated
        if result.rowcount > 0:
            return {"auto_reply": auto_reply_status}
        return None

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()