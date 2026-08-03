from __future__ import annotations

import json
from typing import Any

from sqlalchemy import text

from app.database.database import SessionLocal


def log_ai_email_action(
    *,
    user_id: int,
    action_type: str,
    status: str = "completed",
    model_name: str | None = None,
    input_text: str | None = None,
    output_text: str | None = None,
    error_message: str | None = None,
    metadata: dict[str, Any] | None = None,
    email_id: str | None = None,
) -> None:
    """Persist assistant-driven email actions into ai_email_actions."""
    db = SessionLocal()
    try:
        db.execute(
            text(
                """
                INSERT INTO ai_email_actions (
                    user_id,
                    email_id,
                    action_type,
                    model_name,
                    status,
                    input_text,
                    output_text,
                    error_message,
                    metadata
                )
                VALUES (
                    :user_id,
                    :email_id,
                    :action_type,
                    :model_name,
                    :status,
                    :input_text,
                    :output_text,
                    :error_message,
                    :metadata
                )
                """
            ),
            {
                "user_id": user_id,
                "email_id": email_id,
                "action_type": action_type,
                "model_name": model_name,
                "status": status,
                "input_text": input_text,
                "output_text": output_text,
                "error_message": error_message,
                "metadata": json.dumps(metadata or {}, ensure_ascii=False),
            },
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        print(f"AI action logging failed: {exc}")
    finally:
        db.close()
