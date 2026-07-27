from pydantic import BaseModel, Field
from typing import List, Optional


class DraftRequest(BaseModel):
    mode: Optional[str] = Field(default="ai", description="'ai' or 'manual'")
    topic: Optional[str] = Field(None, description="Short description of the draft intent")
    recipients: Optional[List[str]] = Field(None, description="List of recipient emails")
    subject: Optional[str] = Field(None, description="Optional subject for the draft")
    tone: Optional[str] = Field(None, description="Tone preference when using AI")
    context: Optional[str] = Field(None, description="Additional context or instructions for the AI")
    target_word_count: Optional[int] = Field(None, description="Optional target length in words")

    # Manual fields
    to: Optional[List[str]] = Field(None, description="Manual 'To' recipients")
    cc: Optional[List[str]] = Field(None, description="Manual 'Cc' recipients")
    bcc: Optional[List[str]] = Field(None, description="Manual 'Bcc' recipients")
    body: Optional[str] = Field(None, description="Message body when creating manually")

    # Generic
    against: Optional[str] = Field(None, description="Optional identifier to attach this draft to (thread/project)")

    class Config:
        schema_extra = {
            "example": {
                "mode": "ai",
                "topic": "Follow up on proposal",
                "recipients": ["client@example.com"],
                "tone": "Friendly",
                "target_word_count": 120,
            }
        }
