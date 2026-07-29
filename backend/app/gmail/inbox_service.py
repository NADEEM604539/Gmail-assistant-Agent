from dotenv import load_dotenv
import os
from app.gmail.gmail_service import GmailService
from sqlalchemy import text
from app.database.database import SessionLocal
from app.gmail.DTO import MessageIdsRequest
load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")


def get_Inbox(user_id : int, max_results=100):
    db = SessionLocal()
    query = text("""
    SELECT refresh_token FROM gmail_accounts
    WHERE user_id = :user_id
""")

    result = db.execute(query, {"user_id": user_id}).mappings().first()

    gmail = GmailService(
        refresh_token=result["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )

    messages = gmail.fetch_latest_emails(max_results=max_results)
    db.close()
    return messages

def trashBunch(user_id : int, request: MessageIdsRequest):
    db = SessionLocal()
    query = text("""
    SELECT refresh_token FROM gmail_accounts
    WHERE user_id = :user_id
""")

    result = db.execute(query, {"user_id": user_id}).mappings().first()

    gmail = GmailService(
        refresh_token=result["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )

    messages = gmail.trash_bulk_messages(message_ids=request.message_ids)
    db.close()
    return messages

def deleteBunch(user_id:int,  request: MessageIdsRequest):
    db = SessionLocal()
    query = text("""
    SELECT refresh_token FROM gmail_accounts
    WHERE user_id = :user_id
        """)

    result = db.execute(query, {"user_id": user_id}).mappings().first()

    gmail = GmailService(
        refresh_token=result["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )

    messages = gmail.delete_bulk_messages(message_ids=request.message_ids)
    db.close()
    return messages

def star_status(user_id:int, message_id:str):
    db = SessionLocal()
    query = text("""
            SELECT refresh_token FROM gmail_accounts
            WHERE user_id = :user_id
                """)
        
    result = db.execute(query, {"user_id": user_id}).mappings().first()
        
    gmail = GmailService(
                refresh_token=result["refresh_token"],
                client_id=GOOGLE_CLIENT_ID,
                client_secret=GOOGLE_CLIENT_SECRET
            )   
    star = gmail.star_message(message_id=message_id)
    return star

     

def read_status(user_id:int, message_id:str):
    db = SessionLocal()
    query = text("""
            SELECT refresh_token FROM gmail_accounts
            WHERE user_id = :user_id
                """)
        
    result = db.execute(query, {"user_id": user_id}).mappings().first()
        
    gmail = GmailService(
                refresh_token=result["refresh_token"],
                client_id=GOOGLE_CLIENT_ID,
                client_secret=GOOGLE_CLIENT_SECRET
            )   
    read = gmail.mark_as_read(message_id=message_id)
     
    
def archive(user_id:int, message_id:str):
    db = SessionLocal()
    query = text("""
            SELECT refresh_token FROM gmail_accounts
            WHERE user_id = :user_id
                """)
        
    result = db.execute(query, {"user_id": user_id}).mappings().first()
        
    gmail = GmailService(
                refresh_token=result["refresh_token"],
                client_id=GOOGLE_CLIENT_ID,
                client_secret=GOOGLE_CLIENT_SECRET
            )    
    archive = gmail.archive_message(message_id=message_id)
    return archive

    
def untrash(user_id:int, message_id:str):
    db = SessionLocal()
    query = text("""
            SELECT refresh_token FROM gmail_accounts
            WHERE user_id = :user_id
                """)
        
    result = db.execute(query, {"user_id": user_id}).mappings().first()
        
    gmail = GmailService(
                refresh_token=result["refresh_token"],
                client_id=GOOGLE_CLIENT_ID,
                client_secret=GOOGLE_CLIENT_SECRET
            ) 
    untrash = gmail.untrash_message(message_id=message_id) 
    return untrash 

    
def markspam(user_id:int, message_id:str):
    db = SessionLocal()
    query = text("""
            SELECT refresh_token FROM gmail_accounts
            WHERE user_id = :user_id
                """)
        
    result = db.execute(query, {"user_id": user_id}).mappings().first()
        
    gmail = GmailService(
                refresh_token=result["refresh_token"],
                client_id=GOOGLE_CLIENT_ID,
                client_secret=GOOGLE_CLIENT_SECRET
            )
    spam = gmail.mark_as_spam(message_id=message_id)
    return spam

    
def mark_not_spam(user_id:int, message_id:str):
    db = SessionLocal()
    query = text("""
            SELECT refresh_token FROM gmail_accounts
            WHERE user_id = :user_id
                """)
        
    result = db.execute(query, {"user_id": user_id}).mappings().first()
        
    gmail = GmailService(
                refresh_token=result["refresh_token"],
                client_id=GOOGLE_CLIENT_ID,
                client_secret=GOOGLE_CLIENT_SECRET
            )    
    not_spam = gmail.mark_as_not_spam(message_id=message_id)
    return not_spam


def delete(user_id:int,  message_id:str):
    db = SessionLocal()
    query = text("""
    SELECT refresh_token FROM gmail_accounts
    WHERE user_id = :user_id
        """)

    result = db.execute(query, {"user_id": user_id}).mappings().first()

    gmail = GmailService(
        refresh_token=result["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )

    messages = gmail.delete_message(message_id=message_id)
    db.close()
    return messages



def trashOne(user_id : int, message_id:str):
    db = SessionLocal()
    query = text("""
    SELECT refresh_token FROM gmail_accounts
    WHERE user_id = :user_id
""")

    result = db.execute(query, {"user_id": user_id}).mappings().first()

    gmail = GmailService(
        refresh_token=result["refresh_token"],
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET
    )

    messages = gmail.trash_message(message_id=message_id)
    db.close()
    return messages
