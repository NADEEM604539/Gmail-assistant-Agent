from dotenv import load_dotenv
import os
from app.gmail.gmail_service import GmailService
from sqlalchemy import text



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

        for message in messages:

            email = message["email"]

            # ---------------------------------
            # Insert Email
            # ---------------------------------

            result = db.execute(
                text("""
                    INSERT INTO emails
                    (
                        user_id,
                        gmail_message_id,
                        gmail_thread_id,
                        history_id,
                        folder,
                        from_name,
                        from_email,
                        to_name,
                        to_email,
                        subject,
                        body,
                        preview,
                        label,
                        category,
                        status,
                        priority,
                        has_attachment,
                        starred,
                        is_important,
                        ai_summary,
                        received_at,
                        sent_at
                    )
                    VALUES
                    (
                        :user_id,
                        :gmail_message_id,
                        :gmail_thread_id,
                        :history_id,
                        :folder,
                        :from_name,
                        :from_email,
                        :to_name,
                        :to_email,
                        :subject,
                        :body,
                        :preview,
                        :label,
                        :category,
                        :status,
                        :priority,
                        :has_attachment,
                        :starred,
                        :is_important,
                        :ai_summary,
                        :received_at,
                        :sent_at
                    )
                """),
                {
                    "user_id": user_id,
                    **email
                }
            )

            email_id = result.lastrowid

            # ---------------------------------
            # Recipients
            # ---------------------------------

            for recipient in message["recipients"]:

                db.execute(
                    text("""
                        INSERT INTO email_recipients
                        (
                            email_id,
                            recipient_type,
                            name,
                            email,
                            recipient_order
                        )
                        VALUES
                        (
                            :email_id,
                            :recipient_type,
                            :name,
                            :email,
                            :recipient_order
                        )
                    """),
                    {
                        "email_id": email_id,
                        **recipient
                    }
                )

            # ---------------------------------
            # Attachments
            # ---------------------------------

            for attachment in message["attachments"]:

                db.execute(
                    text("""
                        INSERT INTO email_attachments
                        (
                            email_id,
                            content_id,
                            filename,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
                            mime_type,
                            size_bytes,
                            storage_url,
                            download_url,
                            checksum,
                            is_inline
                        )
                        VALUES
                        (
                            :email_id,
                            :content_id,
                            :filename,
                            :mime_type,
                            :size_bytes,
                            :storage_url,
                            :download_url,
                            :checksum,
                            :is_inline
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
