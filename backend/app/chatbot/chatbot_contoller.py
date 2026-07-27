from fastapi import APIRouter, Depends
from app.auth.jwt.service import get_current_user
from app.chatbot.chatbot_DTO import chat_Request
import time


router = APIRouter(
    prefix='/chatbot',
    tags=['chatbot']
)


@router.post('/')
def chat(request: chat_Request, current_user= Depends(get_current_user)):
    time.sleep(5)
    return {
        "result":"welcome user to this big world"
    }
