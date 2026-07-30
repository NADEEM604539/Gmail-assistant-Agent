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


load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")


def registerEmailLoad(user_id: int, token: str, db):
    gmail = GmailService(
        refresh_token=token,
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )

    # 1. Fetch raw payload objects from Google API
    raw_messages = gmail.fetch_latest_emails(max_results=100)
    parsed_messages = []

    try:
        for raw_email in raw_messages:
            # Extract immutable API identifiers directly from raw Google response
            gmail_msg_id = raw_email.get("id")
            gmail_thread_id = raw_email.get("threadId")
            history_id = int(raw_email.get("historyId", 0))

            # Parse user-facing fields using Short_email_parser
            email = Short_email_parser(raw_email)
            parsed_messages.append(email)

            # Map ENUM Folder safely
            folder_map = {
                "inbox": "inbox",
                "sent": "sent",
                "draft": "draft",
                "spam": "spam",
                "trash": "trash",
            }
            folder_val = folder_map.get(email.get("folder", "").lower(), "inbox")

            # Map ENUM Status safely
            raw_status = email.get("status", "").lower()
            if raw_status in ["read", "unread", "draft", "sent", "deleted"]:
                status_val = raw_status
            elif raw_status == "delivered":
                status_val = "sent"
            else:
                status_val = "unread"

            # Priority mapping
            priority_val = "high" if email.get("importance") == "high" else "medium"

            # Primary recipient mapping
            to_list = email.get("to", [])
            primary_to_name = to_list[0].get("name") if to_list and isinstance(to_list[0], dict) else None
            primary_to_email = to_list[0].get("email") if to_list and isinstance(to_list[0], dict) else None

            # Date formatting safely
            dt = email.get("date")
            formatted_date = dt.strftime("%Y-%m-%d %H:%M:%S") if isinstance(dt, datetime) else None

            # Labels and Categories
            labels_list = email.get("labels", [])
            primary_label = labels_list[0] if labels_list else None
            category_val = email.get("category", "General")

            # Sender information safety check
            from_info = email.get("from", {})
            from_name = from_info.get("name") if isinstance(from_info, dict) else None
            from_email = from_info.get("email") if isinstance(from_info, dict) else None

            # -------------------------------
            # 2. Insert email and retrieve ID reliably
            # -------------------------------
            insert_stmt = text("""
                INSERT INTO emails (
                    user_id, gmail_message_id, gmail_thread_id, history_id,
                    folder, from_name, from_email, to_name, to_email,
                    subject, body, preview, label, category, status,
                    priority, has_attachment, starred, is_important,
                    received_at, sent_at
                ) VALUES (
                    :user_id, :gmail_message_id, :gmail_thread_id, :history_id,
                    :folder, :from_name, :from_email, :to_name, :to_email,
                    :subject, :body, :preview, :label, :category, :status,
                    :priority, :has_attachment, :starred, :is_important,
                    :received_at, :sent_at
                )
            """)

            result = db.execute(insert_stmt, {
                "user_id": user_id,
                "gmail_message_id": gmail_msg_id,
                "gmail_thread_id": gmail_thread_id,
                "history_id": history_id,
                "folder": folder_val,
                "from_name": from_name,
                "from_email": from_email,
                "to_name": primary_to_name,
                "to_email": primary_to_email,
                "subject": email.get("subject", ""),
                "body": email.get("body", ""),
                "preview": email.get("preview", ""),
                "label": primary_label,
                "category": category_val,
                "status": status_val,
                "priority": priority_val,
                "has_attachment": bool(email.get("hasAttachment", False)),
                "starred": bool(email.get("starred", False)),
                "is_important": bool(email.get("important", False)),
                "received_at": formatted_date if folder_val != "sent" else None,
                "sent_at": formatted_date if folder_val == "sent" else None,
            })

            # Retrieve inserted primary key
            email_id = result.lastrowid

            # -------------------------------
            # 3. Insert email recipients
            # -------------------------------
            for r_type in ["to", "cc", "bcc"]:
                recipients = email.get(r_type, [])
                if isinstance(recipients, list):
                    for idx, r in enumerate(recipients):
                        if isinstance(r, dict) and r.get("email"):
                            db.execute(text("""
                                INSERT INTO email_recipients (
                                    email_id, recipient_type, name, email, recipient_order
                                ) VALUES (
                                    :email_id, :recipient_type, :name, :email, :recipient_order
                                )
                            """), {
                                "email_id": email_id,
                                "recipient_type": r_type,
                                "name": r.get("name"),
                                "email": r.get("email"),
                                "recipient_order": idx
                            })

            # -------------------------------
            # 4. Insert email attachments
            # -------------------------------
            attachments = email.get("attachments", [])
            if isinstance(attachments, list):
                for att in attachments:
                    if isinstance(att, dict):
                        db.execute(text("""
                            INSERT INTO email_attachments (
                                email_id, filename, mime_type, attachment_id, size_bytes
                            ) VALUES (
                                :email_id, :filename, :mime_type, :attachment_id, :size_bytes
                            )
                        """), {
                            "email_id": email_id,
                            "filename": att.get("filename", "unnamed"),
                            "mime_type": att.get("mime_type"),
                            "attachment_id": att.get("attachment_id"),
                            "size_bytes": att.get("size", 0)
                        })

        db.commit()

    except Exception as e:
        db.rollback()
        raise e

    return parsed_messages

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
        query = text("""
            UPDATE gmail_accounts
            SET auto_reply = :reply
            WHERE user_id = :user_id
        """)
        
        result = db.execute(query, {
            "user_id": user_id,
            "reply": auto_reply_status
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