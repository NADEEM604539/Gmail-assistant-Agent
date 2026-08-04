from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from openai import BadRequestError

from app.chatbot.agent.retrieval.retrieval_from_docs import retrieval_from_docs
from app.chatbot.agent.llm.error_handling import build_agent_error_response
from app.chatbot.agent.tools import knowledge_tools


llm = ChatOpenAI(
    model="gpt-4.1-mini",
    base_url="https://openai-rg-nadeem.openai.azure.com/openai/v1",
)

tools = knowledge_tools
agent = create_agent(
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

def _invoke_agent(user_id:int, query:str, system_prompt:str, conversation_history: list[dict] | None = None):
    history_messages = []
    for item in conversation_history or []:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        content = item.get("content")
        if role and content:
            history_messages.append({"role": role, "content": content})

    try:
        result = agent.invoke(
            {
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    *history_messages,
                    {
                        "role": "user",
                        "content": query,
                    },
                ]
            }
        )
    except BadRequestError as error:
        return build_agent_error_response("retrieval", user_id, query, error)

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
            "agent": "retrieval",
            "user_id": user_id,
            "query": query,
            "tool_names": [call["name"] for call in tool_calls if call.get("name")],
            "tool_call_count": len(tool_calls),
        },
        "tool_calls": tool_calls,
        "messages": [_serialize_message(msg) for msg in messages],
    }


def callagent(user_id:int, query:str, conversation_history: list[dict] | None = None):
    system_prompt = (
        f"Use retrieval tools for user_id={user_id}. Only use that user's data. "
        "You MUST strictly follow the user's stored preferences. Before answering, you must consult the preference tools if preferences are relevant. "
        "Treat preferences as hard constraints, not soft suggestions. Your response must align with those preferences exactly."
    )
    return _invoke_agent(user_id=user_id, query=query, system_prompt=system_prompt, conversation_history=conversation_history)


def generate_auto_reply(user_id:int, query:str, conversation_history: list[dict] | None = None):
    system_prompt = (
        "You are an email auto-reply assistant. You MUST strictly follow the user's stored preferences. "
        "Before generating any reply, consult the preference tools if preferences are relevant and treat them as hard constraints. "
        "Use the retrieval tools when the message asks about information that may be present in the user's uploaded documents. "
        "Only answer when the retrieved documents provide enough evidence and the reply still matches the user's preferences. "
        "If the question is too open-ended, ambiguous, unsupported by the retrieved content, or conflicts with the user's preferences, "
        "reply with a short fallback message saying you cannot answer from the information currently available. "
        "Do not invent facts or make up policy details. Keep the response concise and suitable for an email reply."
    )
    return _invoke_agent(user_id=user_id, query=query, system_prompt=system_prompt, conversation_history=conversation_history)

