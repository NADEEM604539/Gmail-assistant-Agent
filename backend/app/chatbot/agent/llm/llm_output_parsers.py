import json
import re

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

from app.chatbot.agent.llm.prompts import EmailDraft_template
from app.chatbot.agent.objects import DraftEmail
from app.chatbot.agent.structures import DraftEmail_parser
from app.gmail.DTO import DraftRequest


load_dotenv()

llm = ChatOpenAI(
    model="gpt-4.1-mini",
    base_url="https://openai-rg-nadeem.openai.azure.com/openai/v1",
)


def _extract_text(result):
    if hasattr(result, "content"):
        content = result.content
        if isinstance(content, list):
            parts = []
            for item in content:
                if hasattr(item, "text"):
                    parts.append(item.text)
                elif isinstance(item, str):
                    parts.append(item)
            return "\n".join(parts)
        return content if isinstance(content, str) else str(content)

    return str(result)


def generateDraft(request: DraftRequest):
    if hasattr(request, "model_dump_json"):
        user_query = request.model_dump_json()
    elif hasattr(request, "model_dump"):
        user_query = json.dumps(request.model_dump())
    else:
        user_query = str(request)

    prompt = EmailDraft_template.format(user_query=user_query)
    draft = llm.invoke(prompt)
    text = _extract_text(draft)

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return DraftEmail_parser.parse(cleaned)
    except Exception:
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict):
                parsed.setdefault("subject", "Draft")
                parsed.setdefault("body", "Please review the generated draft.")
                return DraftEmail(**parsed)
        except Exception:
            pass

        fallback_body = cleaned or "Please review the generated draft."
        return DraftEmail(
            subject="Draft",
            body=fallback_body,
        )

