import json
import re

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

from app.chatbot.agent.llm.prompts import EmailDraft_template, ShouldReply_template, EmailReply_template
from app.chatbot.agent.objects import DraftEmail
from app.chatbot.agent.structures import DraftEmail_parser, ShouldReply_parser, ReplyEmail_parser
from app.gmail.DTO import DraftRequest, User
from app.gmail.Parser.shortEmailParser import Short_email_parser


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


def generateDraft(request: DraftRequest, user_details: User):
    if hasattr(request, "model_dump_json"):
        user_query = request.model_dump_json()
    elif hasattr(request, "model_dump"):
        user_query = json.dumps(request.model_dump())
    else:
        user_query = str(request)

    prompt = EmailDraft_template.format(user_query=user_query, user_details = user_details)
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

def shouldReply(email: Short_email_parser):
    prompt= ShouldReply_template.format(email=email)
    response = llm.invoke(prompt)
    return ShouldReply_parser.parse(response.content).reply

def createReplyEmail(request:Short_email_parser, user_details:User):
    prompt = EmailReply_template.format(user_details=user_details, email=request)
    response = llm.invoke(prompt)
    return ReplyEmail_parser.parse(response.content)