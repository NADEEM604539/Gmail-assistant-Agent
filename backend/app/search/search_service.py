from __future__ import annotations

import re
from typing import Any

from sqlalchemy import text

from app.database.database import SessionLocal
from app.gmail.gmail_service import GmailService
from app.gmail.Parser.shortEmailParser import Short_email_parser

import os

from dotenv import load_dotenv

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")


def _get_gmail_service(user_id: int) -> GmailService:
    db = SessionLocal()
    query = text("""
        SELECT refresh_token FROM gmail_accounts
        WHERE user_id = :user_id
    """)
    result = db.execute(query, {"user_id": user_id}).mappings().first()
    db.close()

    if not result or not result.get("refresh_token"):
        raise ValueError("No Gmail account connected for this user.")

    return GmailService(
        refresh_token=result["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
    )


def _normalize_query(query: str) -> str:
    return re.sub(r"\s+", " ", (query or "").strip())


def _build_query_terms(query: str) -> list[str]:
    normalized = _normalize_query(query).lower()
    if not normalized:
        return []

    terms = [term for term in re.split(r"[^a-z0-9]+", normalized) if term]
    if not terms:
        return []
    return terms


def _score_email(email: dict[str, Any], terms: list[str]) -> tuple[int, bool]:
    text_blob = " ".join(
        filter(
            None,
            [
                email.get("subject") or "",
                email.get("preview") or "",
                email.get("body") or "",
                (email.get("from") or {}).get("name") or "",
                (email.get("from") or {}).get("email") or "",
                *(
                    [recipient.get("email") or "" for recipient in (email.get("to") or [])]
                ),
                *(
                    [recipient.get("email") or "" for recipient in (email.get("cc") or [])]
                ),
            ],
        )
    ).lower()

    matches = 0
    for term in terms:
        if term in text_blob:
            matches += 1

    highlighted = any(term in text_blob for term in terms)
    return matches, highlighted


def search_gmail(user_id: int, query: str, limit: int = 20) -> dict[str, Any]:
    normalized_query = _normalize_query(query)
    terms = _build_query_terms(normalized_query)
    gmail = _get_gmail_service(user_id)

    response = (
        gmail.service.users()
        .messages()
        .list(userId="me", maxResults=max(limit * 3, 20), q=normalized_query)
        .execute()
    )

    message_ids = [message["id"] for message in response.get("messages", [])]
    results = []

    for message_id in message_ids:
        raw_message = (
            gmail.service.users()
            .messages()
            .get(userId="me", id=message_id, format="full")
            .execute()
        )
        structured = Short_email_parser(raw_message)
        score, matched = _score_email(structured, terms)
        if not terms or matched:
            results.append({
                **structured,
                "score": score,
                "matched": matched,
            })

    results.sort(key=lambda item: (-item.get("score", 0), item.get("subject") or ""))
    results = results[:limit]

    return {
        "query": normalized_query,
        "result_count": len(results),
        "results": results,
        "ai_search": bool(normalized_query),
    }


def log_search_query(user_id: int, query: str, result_count: int, is_ai_query: bool = False) -> None:
    db = SessionLocal()
    try:
        query_text = text("""
            INSERT INTO search_queries (user_id, query, is_ai_query, result_count)
            VALUES (:user_id, :query, :is_ai_query, :result_count)
        """)
        db.execute(query_text, {
            "user_id": user_id,
            "query": query,
            "is_ai_query": is_ai_query,
            "result_count": result_count,
        })
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_recent_searches(user_id: int, limit: int = 6) -> list[dict[str, Any]]:
    db = SessionLocal()
    try:
        rows = db.execute(
            text("""
                SELECT query
                FROM search_queries
                WHERE user_id = :user_id
                ORDER BY created_at DESC, id DESC
                LIMIT :limit
            """),
            {"user_id": user_id, "limit": limit},
        ).mappings().all()
    finally:
        db.close()

    return [{"query": row["query"]} for row in rows]
