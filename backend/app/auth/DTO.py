from pydantic import BaseModel


class GoogleLoginRequest(BaseModel):
    code: str
