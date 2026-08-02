from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from app.chatbot.agent.retrieval.retrieval_from_docs import retrieval_from_docs


llm = ChatOpenAI(
    model="gpt-4.1-mini",
    base_url="https://openai-rg-nadeem.openai.azure.com/openai/v1",
)

tools = [retrieval_from_docs]
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

def callagent(user_id:int, query:str):
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "system",
                    "content": f"Use retrieval tools for user_id={user_id}. Only use that user's data.",
                },
                {
                    "role": "user",
                    "content": query,
                },
            ]
        }
    )

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

