from app.database.database import SessionLocal
from sqlalchemy import text
from app.auto_reply.reply_service import reply_mails_by_user


def autoReply():
    db = SessionLocal()
    query = text("""
               SELECT user_id FROM gmail_accounts
               WHERE auto_reply =:auto_reply AND status = :status
            """)
    users = db.execute(query, {
        "auto_reply":True,
        "status":"ACTIVE"
    }).fetchall()

    for user in users:
        reply_mails_by_user(user.user_id, db)


    db.close()
    return {
        "success": True
    }
