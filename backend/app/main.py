import os

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from app.auth.auth_controller import router as auth_router
from app.gmail.gmail_controller import router as gmail_router
from app.stats.stats_controller import router as stats_router
from app.chatbot.chatbot_contoller import router as chat_router
from app.preferences.preferences_controller import router as preferences_router
from app.auto_reply.schedular import start_scheduler, stop_schedular
from app.embeddings.embed_controller import router as embed_router
from app.search.search_controller import router as search_router

from app.database.database import Base
from app.database.database import engine

from app.database.models.users import User

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://gmail-assistant-eight.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def starter():
    start_scheduler()

@app.on_event("shutdown")
async def shutDown():
    stop_schedular()

@app.get('/')
def backend():
    return {'Hello world'}

@app.get('/db-check')
def db_check():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 2 + 2 AS result")).scalar_one()
        return {
            "db_connected": True,
            "query": "SELECT 2 + 2 AS result",
            "result": result,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"DB check failed: {str(exc)}")

app.include_router(auth_router, prefix='/api')
app.include_router(gmail_router, prefix='/api')
app.include_router(stats_router, prefix='/api')
app.include_router(chat_router, prefix='/api')
app.include_router(preferences_router, prefix='/api')
app.include_router(embed_router, prefix='/api')
app.include_router(search_router, prefix='/api')