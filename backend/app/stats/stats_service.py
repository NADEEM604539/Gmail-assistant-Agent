from sqlalchemy import text
from app.database.database import SessionLocal


def get_dashboard_stats(user_id: int):
    db = SessionLocal()
    query = text("""
        SELECT
            (
                SELECT COUNT(*)
                FROM ai_email_actions
                WHERE user_id = :user_id
            ) AS accessible_emails,

            (
                SELECT COUNT(*)
                FROM ai_email_actions
                WHERE user_id = :user_id
                AND action_type = 'reply_generated'
                AND status = 'completed'
            ) AS reply_generated
    """)

    result = db.execute(
        query,
        {
            "user_id": user_id
        }
    ).fetchone()

    db.close()

    return [
        {
            "id": 1,
            "title": "Total AI actions",
            "value": result.accessible_emails,
            "icon": "database",
            "color": "#34A853"
        },
        {
            "id": 2,
            "title": "Total Auto-Replies",
            "value": result.reply_generated,
            "icon": "send",
            "color": "#FBBC05"
        },
        {
            "id": 3,
            "title": "others",
            "value": result.accessible_emails - result.reply_generated,
            "icon": "mail",
            "color": "#7C3AED"
        }
    ]