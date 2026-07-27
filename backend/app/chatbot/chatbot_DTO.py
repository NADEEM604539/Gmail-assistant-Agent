from pydantic import BaseModel

class chat_Request(BaseModel):
    message: str
    message_ids: list[str]