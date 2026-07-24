import os
from pathlib import Path
import httpx
from dotenv import load_dotenv
from app.database.database import SessionLocal
from fastapi import HTTPException
from sqlalchemy import text
from app.auth.jwt.service import create_access_token
from app.gmail.gmail_service import GmailService
from app.gmail.gmail import registerEmailLoad

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

    try:
        query = text("""
                    SELECT * FROM users 
                    where email=:email
                    """)
        
        existing_user = db.execute(query, {
            "email": user["email"]
        }).mappings().first()

        if existing_user:
            response = loginUser(user, refresh_token, db)
        else:
            response = registerUser(user, refresh_token, db)

    finally:
        db.close()
    return response

def registerUser(user, refresh_token, db):
    insert_query = text("""
    INSERT INTO users (google_id, name, email, profile_picture)
    VALUES (:google_id, :name, :email, :profile_picture)
""")
    db.execute(insert_query, {
        "google_id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "profile_picture": user.get("picture")
    })
    db.commit()
    select_query = text("""
    SELECT * FROM users
    WHERE email = :email
    """)
    User=  db.execute(select_query, {"email": user["email"]}).mappings().first()
    data = registerEmailLoad(user_id=User.id, token= refresh_token, db= db)
    payload = {
               "user_id":User.id,
               "name":user['name'],
               "email": user['email']
           }
    insert_gmail_query = text("""
    INSERT INTO gmail_accounts (
        user_id,
        email_address,
        provider,
        is_primary,
        refresh_token
    )
    VALUES (
        :user_id,
        :email_address,
        'google',
        TRUE,
        :refresh_token
    )
    """)

    db.execute(insert_gmail_query, {
        "user_id": User.id,
        "email_address": user["email"],
        "refresh_token": refresh_token
    })

    db.commit()
    token = create_access_token(payload)
    return {
        "user":{
            "user_id":User.id,
            "name":user['name'],
            "email": user['email']
          },
        "access_token":token
       }


def loginUser(user, refresh_token, db):
    update_query = text("""
    UPDATE gmail_accounts 
    SET refresh_token = :refresh_token
    WHERE email = :email 
""")
    
    db.execute(update_query, {
        "refresh_token": refresh_token,
        "email": user["email"]
    })
    db.commit()

    
    select_query = text("""
    SELECT * FROM users
    WHERE email = :email
    """)
    results = db.execute(select_query, {"email": user["email"]}).mappings().first()
    payload = {
            "user_id":results.id,
            "name":user['name'],
            "email": user['email']
        }
    token = create_access_token(payload)
    return {
       "user":{
            "user_id":results.id,
            "name":user['name'],
            "email": user['email']
       },
       "access_token":token
    }


