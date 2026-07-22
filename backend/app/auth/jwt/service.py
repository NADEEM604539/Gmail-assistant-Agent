import jwt
from datetime import datetime, timedelta
from jwt import ExpiredSignatureError, InvalidTokenError
from fastapi import HTTPException
import os
from dotenv import load_dotenv
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv()
security = HTTPBearer()

SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES'))


def create_access_token(data: dict):
    if not SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="SECRET_KEY is not configured"
        )

    payload = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload.update({"exp": expire})

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token


def verify_access_token(token: str):
    if not SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="SECRET_KEY is not configured"
        )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Access token has expired"
        )

    except InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid access token"
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    return verify_access_token(token)