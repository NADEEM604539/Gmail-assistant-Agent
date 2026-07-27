from langchain_core.output_parsers import PydanticOutputParser
from app.chatbot.agent.objects import DraftEmail

DraftEmail_parser = PydanticOutputParser(
    pydantic_object = DraftEmail
)


