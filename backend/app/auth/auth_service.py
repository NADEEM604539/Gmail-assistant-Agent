import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from fastapi import HTTPException
from sqlalchemy import text


load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")


async def googleLogin(code: str):
    db = SessionLocal()
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
    try:
        query = text("""
                    SELECT * FROM users 
                    where email=:email
                    """)
        
        results = db.execute(query, {
            "email":user['email']
        }).mappings().all()
        if results:
            User = loginUser(user, refresh_token, db)
        else:
            User = registerUser(user, refresh_token, db)
    finally:
        db.close()
        
    return {
        "user": user,
        "google_tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": expires_in
        }
    }

def registerUser(user, refresh_token, db):
    query = text("""
    INSERT INTO users (google_id, name, email, profile_picture, refresh_token)
    VALUES (:google_id, :name, :email, :profile_picture, :refresh_token)
""")
    results = db.execute(query, {
        "google_id":user['id'],
        "name": user['name'],
        "email":user['email'],
        "profile_picture":user['picture'], 
        "refresh_token":refresh_token
    })
    db.commit()
    return results


def loginUser(user, refresh_token, db):
    query = text("""
    UPDATE users 
    SET refresh_token = :refresh_token
    WHERE email = :email 
""")
    
    results = db.execute(query, {
        "refresh_token":refresh_token,
        "email":user['email']
    })
    db.commit()
    return results

