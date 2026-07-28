from dotenv import load_dotenv
import os
from app.gmail.gmail_service import GmailService
from sqlalchemy import text
from app.database.database import SessionLocal
from datetime import datetime
import json
from app.gmail.Parser.fullEmailParser import parse_email_full


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

    messages = gmail.fetch_latest_emails(max_results=100)

    try:

        for email in messages:

            # -------------------------------
            # Insert Email
            # -------------------------------

            result = db.execute(
                text("""
                    INSERT INTO emails
                    (
                        user_id,
                        gmail_message_id,
                        gmail_thread_id,
                        history_id,

                        subject,
                        body,
                        snippet,

                        sender_name,
                        sender_email,

                        recipients,
                        labels,

                        unread,
                        starred,
                        important,

                        email_date,

                        has_attachments
                    )
                    VALUES
                    (
                        :user_id,
                        :gmail_message_id,
                        :gmail_thread_id,
                        :history_id,

                        :subject,
                        :body,
                        :snippet,

                        :sender_name,
                        :sender_email,

                        :recipients,
                        :labels,

                        :unread,
                        :starred,
                        :important,

                        :email_date,

                        :has_attachments
                    )
                """),
                {
                    "user_id":user_id,
                    "gmail_message_id": email["id"],
                    "gmail_thread_id": email["thread_id"],
                    "history_id": email["history_id"],

                    "subject": email["subject"],
                    "body": email["body"],
                    "snippet": email["snippet"],

                    "sender_name": email["from"]["name"],
                    "sender_email": email["from"]["email"],

                    "recipients": json.dumps(email["to"]),
                    "labels": json.dumps(email["labels"]),

                    "unread": email["unread"],
                    "starred": email["starred"],
                    "important": email["important"],

                    "email_date": email["date"],

                    "has_attachments": len(email["attachments"]) > 0,
                }
            )

            email_id = result.lastrowid

            # -------------------------------
            # Insert Attachments
            # -------------------------------

            for attachment in email["attachments"]:

                db.execute(
                    text("""
                        INSERT INTO email_attachments
                        (
                            email_id,
                            filename,
                            mime_type,
                            attachment_id,
                            size
                        )
                        VALUES
                        (
                            :email_id,
                            :filename,
                            :mime_type,
                            :attachment_id,
                            :size
                        )
                    """),
                    {
                        "email_id": email_id,
                        **attachment
                    }
                )

        db.commit()

    except Exception:
        db.rollback()
        raise

    return messages




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





