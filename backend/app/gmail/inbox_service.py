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
    """
    Fetches the inbox messages according to a specific user with number of results
    """
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
    """Move multiple Gmail messages to trash."""
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
    """Delete multiple Gmail messages permanently."""
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


def  manage_star_status(user_id:int, message_id:str, star_status:bool):
    """Manage staring or unstaring of the email the value passed in the star_status is set as the value """
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
    if star_status:
        status = gmail.star_message(message_id=message_id)
    else:
        status = gmail.unstar_message(message_id=message_id)
    db.close()
    return status

     


def read_status(user_id:int, message_id:str):
    """Toggle a Gmail message read state."""
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
    read = gmail.toggle_read_status(message_id=message_id)
    db.close()
    return read
     
    

def archive(user_id:int, message_id:str):
    """Archive a Gmail message."""
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
    db.close()
    return archive

    

def untrash(user_id:int, message_id:str):
    """Restore a Gmail message from trash."""
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
    db.close()
    return untrash 

    

def markspam(user_id:int, message_id:str):
    """Mark a Gmail message as spam."""
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
    db.close()
    return spam

    

def mark_not_spam(user_id:int, message_id:str):
    """Mark a Gmail message as not spam."""
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
    db.close()
    return not_spam



def delete(user_id:int,  message_id:str):
    """Delete a Gmail message permanently."""
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
    """Move one Gmail message to trash."""
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
