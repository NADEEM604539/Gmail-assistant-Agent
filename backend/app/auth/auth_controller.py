from fastapi import APIRouter, Depends
from app.auth.auth_service import googleLogin
from app.auth.DTO import GoogleLoginRequest
from app.auth.jwt.service import get_current_user
import os
import httpx


router = APIRouter(
    prefix='/auth',
    tags=['Auth']
)

@router.post('/login')
def login():
    pass


@router.post("/google/callback")
async def google_login(data: GoogleLoginRequest):
    return await googleLogin(data.code)


@router.get('/user')
def user(current_user= Depends(get_current_user)):
    return current_user
