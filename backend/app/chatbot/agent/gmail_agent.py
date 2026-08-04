from __future__ import annotations

import re

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from openai import BadRequestError

from app.chatbot.agent.tools import gmail_tools  
from app.chatbot.agent.llm.error_handling import build_agent_error_response
from app.gmail.reply_service import send_email as _send_email
from app.database.ai_action_service import log_ai_email_action


llm = ChatOpenAI(
    model="gpt-4.1-mini",
    base_url="https://openai-rg-nadeem.openai.azure.com/openai/v1",
)

tools = gmail_tools
gmail_agent = create_agent(
    model=llm,
    tools=tools
)


def _serialize_message(message):
    return {
        "type": message.__class__.__name__,
        "content": getattr(message, "content", None),
        "tool_calls": getattr(message, "tool_calls", None),
        "additional_kwargs": getattr(message, "additional_kwargs", None),
        "response_metadata": getattr(message, "response_metadata", None),
        "name": getattr(message, "name", None),
        "tool_call_id": getattr(message, "tool_call_id", None),
    }


def _extract_token_usage(message):
    metadata = getattr(message, "response_metadata", None) or {}
    usage = metadata.get("token_usage", {}) if isinstance(metadata, dict) else {}
    return {
        "input_tokens": int(usage.get("prompt_tokens", 0) or 0),
        "output_tokens": int(usage.get("completion_tokens", 0) or 0),
        "total_tokens": int(usage.get("total_tokens", 0) or 0),
    }


def _normalize_query(query: str) -> str:
    lines = [line.strip() for line in query.splitlines() if line.strip()]
    filtered = [line for line in lines if not line.lower().startswith(("i’m ready to review", "i'm ready to review", "i am ready to review"))]
    return " ".join(filtered).strip()


def _extract_direct_email_target(query: str) -> str | None:
    match = re.search(r"\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b", query)
    return match.group(0) if match else None


def _extract_direct_email_body(query: str) -> str:
    text = query.strip()
    patterns = [
        r"(?:that|saying|says|telling(?: him| her| them)? that|reminding(?: him| her| them)? that)\s+(.*)$",
        r"(?:about|regarding)\s+(.*)$",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE | re.DOTALL)
        if match:
            candidate = match.group(1).strip().rstrip(".")
            if candidate:
                return candidate
	
    return text


def _build_subject(body: str) -> str:
    snippet = body.split(".")[0].strip()
    if not snippet:
        return "Follow-up"
    keywords = ["gym", "meeting", "follow-up", "reminder", "update", "check-in"]
    for keyword in keywords:
        if keyword in snippet.lower():
            return f"{keyword.title()} reminder"
    return "Quick follow-up"


def _maybe_send_direct_email(user_id: int, query: str) -> dict | None:
    normalized_query = _normalize_query(query)
    lowered = normalized_query.lower()
    if (
        "send an email" not in lowered
        and "send email" not in lowered
        and not lowered.startswith("email ")
    ):
        return None

    recipient = _extract_direct_email_target(normalized_query)
    if not recipient:
        return None

    body = _extract_direct_email_body(normalized_query)
    subject = _build_subject(body)
    result = _send_email(
        user_id=user_id,
        subject=subject,
        body=body,
        to=[recipient],
    )

    log_ai_email_action(
        user_id=user_id,
        action_type="email_sent",
        status="completed",
        input_text=body,
        output_text=str(result),
        metadata={"subject": subject, "to": [recipient]},
        email_id=result.get("id") if isinstance(result, dict) else None,
    )

    return {
        "content": f"Sent email to {recipient} with subject '{subject}'.",
        "token_usage": {
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
        },
        "backend_details": {
            "agent": "gmail",
            "user_id": user_id,
            "query": query,
            "message_ids": [],
            "tool_names": ["send_email"],
            "tool_call_count": 1,
            "direct_send": True,
            "recipient": recipient,
            "subject": subject,
            "body_preview": body[:200],
            "send_result": result,
        },
        "tool_calls": [
            {
                "name": "send_email",
                "args": {
                    "user_id": user_id,
                    "subject": subject,
                    "body": body,
                    "to": [recipient],
                },
                "id": None,
                "type": "tool_call",
            }
        ],
        "messages": [],
    }

def call_gmail_Agent(user_id: int, query: str, message_ids:list[str], conversation_history: list[dict] | None = None):
    direct_send = _maybe_send_direct_email(user_id=user_id, query=query)
    if direct_send is not None:
        return direct_send

    history_messages = []
    for item in conversation_history or []:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        content = item.get("content")
        if role and content:
            history_messages.append({"role": role, "content": content})

    try:
        result = gmail_agent.invoke(
            {
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            f"Help the authenticated Gmail user with user_id={user_id}. "
                            "Use tools when needed, ask for missing identifiers, and only act on this user's data. "
                            "You MUST strictly follow the user's stored preferences. Treat preferences as hard constraints, not suggestions. "
                            "Before acting or replying, consult the preference tools if preferences are relevant so the reply or action respects the user's configured settings exactly. "
                            "If the request is a straightforward email send or draft, keep the wording simple and avoid echoing the user's prompt verbatim."
                        ),
                    },
                    *history_messages,
                    {
                        "role": "user",
                        "content": f"message_ids={message_ids}. { _normalize_query(query) }",
                    },
                ]
            }
        )
    except BadRequestError as error:
        return build_agent_error_response("gmail", user_id, query, error, message_ids)

    messages = result.get("messages", [])
    tool_calls = []
    for msg in messages:
        for call in getattr(msg, "tool_calls", []) or []:
            tool_calls.append(
                {
                    "name": call.get("name"),
                    "args": call.get("args"),
                    "id": call.get("id"),
                    "type": call.get("type"),
                }
            )

    final_message = messages[-1] if messages else None
    final_content = getattr(final_message, "content", "") if final_message else ""
    token_usage = _extract_token_usage(final_message) if final_message else {
        "input_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0,
    }

    return {
        "content": final_content,
        "token_usage": token_usage,
        "backend_details": {
            "agent": "gmail",
            "user_id": user_id,
            "query": query,
            "message_ids": message_ids,
            "tool_names": [call["name"] for call in tool_calls if call.get("name")],
            "tool_call_count": len(tool_calls),
        },
        "tool_calls": tool_calls,
        "messages": [_serialize_message(msg) for msg in messages],
    }

