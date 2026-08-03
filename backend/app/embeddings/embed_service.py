from app.database.database import SessionLocal
from sqlalchemy import text
from fastapi import UploadFile, HTTPException
from app.embeddings.perform_embedding import generate_vector_embeddings, delete_document
import os

def get_embed_docs(user_id:int):
    """
    This get all the documents uploaded for a specific user knowlege source for implementing RAG
    """
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

def delete_doc(user_id: int, doc_id: int):
    """
    Deletes a document and all of its associated vector embeddings.

    This function performs the following operations:
    1. Deletes the document's vector embeddings from Pinecone.
    2. Deletes the document record from the database.
    3. Rolls back the transaction if any operation fails.

    Args:
        user_id (int): The ID of the document owner.
        doc_id (int): The ID of the document to delete.

    Returns:
        dict: A success message if the document and its embeddings are deleted successfully.

    Raises:
        HTTPException:
            - 404: If the document does not exist.
            - 500: If deleting embeddings or the database record fails.
    """
    db = SessionLocal()

    try:
        # -----------------------------
        # Delete vectors from Pinecone
        # -----------------------------
        success = delete_document(
            user_id=user_id,
            doc_id=doc_id
        )

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete document vectors from Pinecone."
            )

        # -----------------------------
        # Delete document from database
        # -----------------------------
        query = text("""
            DELETE FROM documents
            WHERE id = :doc_id
            AND user_id = :user_id
        """)

        result = db.execute(
            query,
            {
                "doc_id": doc_id,
                "user_id": user_id
            }
        )

        db.commit()

        if result.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Document not found."
            )

        return {
            "message": "Document deleted successfully."
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )

    finally:
        db.close()