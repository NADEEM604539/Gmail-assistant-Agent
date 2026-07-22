import os
import httpx
from sqlalchemy.orm import Session
from database.database import get_db
from fastapi import HTTPException, Depends


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")


async def googleLogin(code: str,db: Session = Depends(get_db)):

    async with httpx.AsyncClient() as client:

        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )

    if token_response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail="Unable to exchange authorization code."
        )

    tokens = token_response.json()

    access_token = tokens["access_token"]
    refresh_token = tokens.get("refresh_token")
    expires_in = tokens["expires_in"]

    async with httpx.AsyncClient() as client:

        user_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={
                "Authorization": f"Bearer {access_token}"
            }
        )

    if user_response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail="Unable to fetch user information."
        )
    
    user = user_response.json()
    print(user)

    return {
        "user": user,
        "google_tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": expires_in
        }
    }