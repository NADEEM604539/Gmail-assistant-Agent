from fastapi import APIRouter
from auth_service import googleLogin
from DTO import GoogleLoginRequest
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

