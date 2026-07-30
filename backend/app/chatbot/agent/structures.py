from langchain_core.output_parsers import PydanticOutputParser
from app.chatbot.agent.objects import DraftEmail, ShouldReply, ReplyEmail

DraftEmail_parser = PydanticOutputParser(
    pydantic_object = DraftEmail
)

ShouldReply_parser =  PydanticOutputParser(
    pydantic_object = ShouldReply
)

ReplyEmail_parser =  PydanticOutputParser(
    pydantic_object = ReplyEmail
)
