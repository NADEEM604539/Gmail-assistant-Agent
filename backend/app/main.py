import os

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.auth.auth_controller import router as auth_router
from app.gmail.gmail_controller import router as gmail_router
from app.stats.stats_controller import router as stats_router
from app.chatbot.chatbot_contoller import router as chat_router
from app.preferences.preferences_controller import router as preferences_router
from app.auto_reply.schedular import start_scheduler, stop_schedular

from app.database.database import Base
from app.database.database import engine

from app.database.models.users import User

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)

app.include_router(auth_router, prefix='/api')
app.include_router(gmail_router, prefix='/api')
app.include_router(stats_router, prefix='/api')
app.include_router(chat_router, prefix='/api')
app.include_router(preferences_router, prefix='/api')