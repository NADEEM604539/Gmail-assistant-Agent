from fastapi import APIRouter, Depends
from app.auth.jwt.service import get_current_user
from app.chatbot.chatbot_DTO import chat_Request
import time
from app.chatbot.agent.langgraph.agent_calling_graph import run_chat_graph


router = APIRouter(
    prefix='/chatbot',
    tags=['chatbot']
)


@router.post('/')
def chat(request: chat_Request, current_user= Depends(get_current_user)):
    response = run_chat_graph(
        user_id=current_user["user_id"],
        query=request.message,
        message_ids=request.message_ids,
    )
    return response
    
