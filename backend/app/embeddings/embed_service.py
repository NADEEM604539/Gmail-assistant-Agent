from app.database.database import SessionLocal
from sqlalchemy import text
from fastapi import UploadFile, HTTPException
from app.embeddings.perform_embedding import generate_vector_embeddings
import os


def get_embed_docs(user_id:int):
    db = SessionLocal()

    query = text("""
            SELECT
                id,
                filename,
                file_type,
                chunk_count,
                status,
                created_at
            FROM documents
            WHERE user_id = :user_id
            ORDER BY created_at DESC
        """)

    result = db.execute(query, {"user_id": user_id})
    db.close()
    return result.mappings().all()


def add_embed_docs(file: UploadFile, user_id: int, purpose: str = None):
    db = SessionLocal()
    try:
        file_bytes = file.file.read()
        filename = file.filename
        file_extension = os.path.splitext(filename)[1].replace('.', '').lower() or 'unknown'

        # 1. Insert initial pending record to get auto-increment ID
        insert_query = text("""
            INSERT INTO documents (user_id, filename, purpose, file_type, chunk_count, status)
            VALUES (:user_id, :filename, :purpose, :file_type, 0, 'processing')
        """)
        
        result = db.execute(insert_query, {
            "user_id": user_id,
            "filename": filename,
            "purpose": purpose,
            "file_type": file_extension
        })
        db.commit()

        doc_id = result.lastrowid

        # 2. Generate vector embeddings and upsert to Pinecone
        chunk_count, status = generate_vector_embeddings(
            file_bytes=file_bytes, 
            filename=filename, 
            user_id=user_id, 
            doc_id=doc_id
        )

        # 3. Update status and chunk_count in database
        update_query = text("""
            UPDATE documents
            SET chunk_count = :chunk_count, status = :status
            WHERE id = :doc_id AND user_id = :user_id
        """)
        
        db.execute(update_query, {
            "chunk_count": chunk_count,
            "status": status,
            "doc_id": doc_id,
            "user_id": user_id
        })
        db.commit()

        # 4. Fetch updated document row and return
        select_query = text("""
            SELECT id, filename, purpose, file_type, chunk_count, status, created_at
            FROM documents
            WHERE id = :doc_id
        """)
        new_doc = db.execute(select_query, {"doc_id": doc_id}).mappings().first()
        return new_doc

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process and save document embeddings: {str(e)}"
        )
    finally:
        db.close()


def delete_doc(user_id:int):
    pass