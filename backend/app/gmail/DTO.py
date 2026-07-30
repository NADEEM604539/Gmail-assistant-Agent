from pydantic import BaseModel, Field
from typing import List, Optional
from types import SimpleNamespace
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Attachment:
    filename: str
    content: Optional[bytes] = None
    mime_type: Optional[str] = None


@dataclass
class DraftPayload:
    subject: str
    body: str
    to: list = field(default_factory=list)
    cc: list = field(default_factory=list)
    bcc: list = field(default_factory=list)
    attachments: list = field(default_factory=list)

def parse_recipients(value: str):
    """
    Turns 'a@example.com,b@example.com' into a list of objects with
    .name / .email attributes, matching what GmailService._build_message
    expects (r.name, r.email).
    """
    if not value:
        return []

    recipients = []
    for raw in value.split(","):
        email = raw.strip()
        if not email:
            continue
        recipients.append(SimpleNamespace(name=None, email=email))

    return recipients


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
        json_schema_extra = {
            "example": {
                "mode": "ai",
                "topic": "Follow up on proposal",
                "recipients": ["client@example.com"],
                "tone": "Friendly",
                "target_word_count": 120,
            }
        }


class MessageIdsRequest(BaseModel):
    message_ids: list[str] = Field(..., min_length=1)

class StarRequest(BaseModel):
        starred: bool


class ReadRequest(BaseModel):
    unread: bool

class AutoReply(BaseModel):
    auto_reply: bool

class User(BaseModel):
    name: str
    email: str

