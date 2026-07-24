from fastapi import APIRouter, Depends
from app.auth.auth_service import googleLogin
from app.auth.DTO import GoogleLoginRequest
from app.auth.jwt.service import get_current_user
from app.gmail.gmail import get_5_emails, getEmail
from app.gmail.inbox_service import get_Inbox
import os
import httpx


router = APIRouter(
    prefix='/gmail',
    tags=['gmail']
)

@router.get('/card')
def cards(current_user= Depends(get_current_user)):
    user_id = current_user["user_id"]
    sections = [
    {
        "key": "received",
        "title": "Last received",
        "accent": "#4285F4",
        "items": get_5_emails(user_id, "in:inbox")
    },
    {
        "key": "sent",
        "title": "Last sent",
        "accent": "#7C3AED",
        "items": get_5_emails(user_id, "in:sent")
    },
    {
        "key": "drafts",
        "title": "Last drafts",
        "accent": "#F59E0B",
        "items": get_5_emails(user_id, "in:draft")
    },
    {
        "key": "important",
        "title": "Last importants",
        "accent": "#0DB927",
        "items": get_5_emails(user_id, "is:important")
    }
]
    return sections


@router.get('/inbox')
def inbox(current_user= Depends(get_current_user)):
    messages = get_Inbox(user_id=current_user["user_id"], max_results=100)
    return messages


@router.get('/{email_id}')
def getMail(email_id: str, current_user = Depends(get_current_user)):
    Email = getEmail(user_id=current_user["user_id"], message_id=email_id)
    return Email