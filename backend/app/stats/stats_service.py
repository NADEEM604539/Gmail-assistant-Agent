from sqlalchemy import text
from app.database.database import SessionLocal


def get_dashboard_stats(user_id: int):
    db = SessionLocal()
    query = text("""
        SELECT
            (
                SELECT COUNT(*)
                FROM emails
                WHERE user_id = :user_id
            ) AS accessible_emails,

            (
                SELECT COUNT(*)
                FROM ai_email_actions
                WHERE user_id = :user_id
                AND action_type = 'draft_created'
                AND status = 'completed'
            ) AS ai_drafts_created,

            (
                SELECT COUNT(*)
                FROM ai_email_actions
                WHERE user_id = :user_id
                AND action_type = 'email_sent'
                AND status = 'completed'
            ) AS agent_sent_emails
    """)

    result = db.execute(
        query,
        {
            "user_id": user_id
        }
    ).fetchone()

    return [
        {
            "id": 1,
            "title": "Accessible by Mailgent",
            "value": result.accessible_emails,
            "icon": "database",
            "color": "#34A853"
        },
        {
            "id": 2,
            "title": "AI Drafts Created",
            "value": result.ai_drafts_created,
            "icon": "mail",
            "color": "#FBBC05"
        },
        {
            "id": 3,
            "title": "Agent Sent Emails",
            "value": result.agent_sent_emails,
            "icon": "send",
            "color": "#7C3AED"
        }
    ]