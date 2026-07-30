from pydantic import BaseModel, EmailStr, Field
from typing import List, Literal, Optional
import operator



class EmailRecipient(BaseModel):
    name: Optional[str] = None
    email: EmailStr


class EmailAttachment(BaseModel):
    filename: str
    mime_type: str
    description: Optional[str] = None
    content: Optional[bytes] = None


class DraftEmail(BaseModel):
    # Recipients
    to: List[EmailRecipient] = Field(default_factory=list)
    cc: List[EmailRecipient] = Field(default_factory=list)
    bcc: List[EmailRecipient] = Field(default_factory=list)

    # Email
    subject: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1)

    # Metadata
    tone: Literal[
        "professional",
        "friendly",
        "formal",
        "casual",
        "apologetic",
        "persuasive",
        "empathetic",
        "confident",
    ]

    priority: Literal[
        "low",
        "normal",
        "high"
    ] = "normal"

    language: str = "English"

    attachments: List[EmailAttachment] = Field(default_factory=list)

    # Internal reasoning for your agent
    summary: Optional[str] = None
    purpose: Optional[str] = None

    # Whether the draft is complete
    needs_human_review: bool = False

    # If information is missing
    missing_information: List[str] = Field(default_factory=list)



class ShouldReply(BaseModel):
    reply: bool = Field(description="tells that an email should be replied to or not")

class ReplyEmail(BaseModel):
    body: str = Field(
        ...,
        min_length=1,
        description="The complete email reply body."
    )