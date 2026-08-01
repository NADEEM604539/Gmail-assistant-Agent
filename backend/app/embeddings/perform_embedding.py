import os
import io
import uuid
from typing import List, Tuple
from fastapi import UploadFile, HTTPException
from sqlalchemy import text
from app.database.database import SessionLocal

# Vector & AI libraries
import numpy as np
from huggingface_hub import InferenceClient
from pinecone import Pinecone
from langchain_text_splitters import RecursiveCharacterTextSplitter


# ------------------------------------------------------------------
# Environment Variables & API Clients
# ------------------------------------------------------------------
HF_TOKEN = os.getenv("HF_TOKEN")
HF_MODEL = os.getenv("HF_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

pc = Pinecone(api_key=PINECONE_API_KEY)
pinecone_index = pc.Index(PINECONE_INDEX_NAME)
hf_client = InferenceClient(api_key=HF_TOKEN)


# ------------------------------------------------------------------
# Helpers: Extraction & Embeddings
# ------------------------------------------------------------------
def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()

    if ext == ".pdf":
        try:
            import pypdf
            pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text_pages = [page.extract_text() or "" for page in pdf_reader.pages]
            return "\n".join(text_pages)
        except Exception as pdf_err:
            print(f"[PDF Extraction Error]: {pdf_err}")
            # Fallback to PyPDF2 if pypdf is missing
            import PyPDF2
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            return "\n".join([page.extract_text() or "" for page in pdf_reader.pages])

    elif ext in [".docx", ".doc"]:
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        return "\n".join([para.text for para in doc.paragraphs if para.text])

    else:
        return file_bytes.decode("utf-8", errors="ignore")


def mean_pooling(token_embeddings: np.ndarray) -> List[float]:
    """Helper to convert token-level HF feature extraction into a single 1D vector."""
    arr = np.array(token_embeddings)
    if arr.ndim == 3:
        # Shape: (batch_size/num_tokens, seq_len, hidden_dim) -> average over sequence length
        return np.mean(arr, axis=1).tolist()
    elif arr.ndim == 2:
        # Shape: (seq_len, hidden_dim) -> average over sequence
        return np.mean(arr, axis=0).tolist()
    return arr.tolist()


def generate_vector_embeddings(file_bytes: bytes, filename: str, user_id: int, doc_id: int) -> Tuple[int, str]:
    try:
        namespace=f"user_id_{user_id}_documents"
        # 1. Extract Text
        raw_text = extract_text_from_file(file_bytes, filename)
        if not raw_text or not raw_text.strip():
            print(f"[Error]: No text extracted from file {filename}")
            return 0, "failed"

        # 2. Recursive Text Splitting
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", " ", ""]
        )
        chunks: List[str] = [c.strip() for c in text_splitter.split_text(raw_text) if c.strip()]

        if not chunks:
            print(f"[Error]: No valid text chunks generated for {filename}")
            return 0, "failed"

        # 3. Generate HuggingFace Embeddings per chunk safely
        pinecone_vectors = []
        for idx, chunk_text in enumerate(chunks):
            try:
                # Get raw feature output from HuggingFace
                raw_embed = hf_client.feature_extraction(chunk_text, model=HF_MODEL)
                
                # Perform mean-pooling to ensure 1D array matching Pinecone dimension (384)
                vector_values = mean_pooling(raw_embed)

                vector_id = f"user_{user_id}_doc_{doc_id}_chunk_{idx}"
                
                pinecone_vectors.append({
                    "id": vector_id,
                    "values": vector_values,
                    "metadata": {
                        "user_id": int(user_id),
                        "doc_id": int(doc_id),
                        "filename": str(filename),
                        "chunk_index": int(idx),
                        "text": str(chunk_text)
                    }
                })
            except Exception as chunk_err:
                print(f"[HF Embedding Error on Chunk {idx}]: {chunk_err}")
                continue

        if not pinecone_vectors:
            print(f"[Error]: Zero vectors created for {filename}")
            return 0, "failed"

        # 4. Batch Upsert to Pinecone
        batch_size = 50
        for i in range(0, len(pinecone_vectors), batch_size):
            batch = pinecone_vectors[i : i + batch_size]
            pinecone_index.upsert(vectors=batch,
                                  namespace=namespace)

        return len(pinecone_vectors), "completed"

    except Exception as e:
        print(f"[Vector Generation Error]: {str(e)}")
        import traceback
        traceback.print_exc()
        return 0, "failed"



def delete_document(user_id: int, doc_id: int):
    """
    Deletes all vectors belonging to a document from Pinecone.
    """

    try:
        namespace = f"user_id_{user_id}_documents"

        # Try to fetch chunk_count from local DB to construct vector ids
        try:
            db = SessionLocal()
            query = text("SELECT chunk_count FROM documents WHERE id = :doc_id AND user_id = :user_id")
            res = db.execute(query, {"doc_id": doc_id, "user_id": user_id}).mappings().first()
            db.close()
            chunk_count = int(res["chunk_count"]) if res and res.get("chunk_count") is not None else 0
        except Exception:
            # If DB lookup fails, proceed with best-effort delete using broad namespace delete (may not be supported)
            chunk_count = 0

        if chunk_count > 0:
            ids = [f"user_{user_id}_doc_{doc_id}_chunk_{i}" for i in range(chunk_count)]
            # Delete in batches to avoid very large requests
            batch_size = 100
            for i in range(0, len(ids), batch_size):
                batch = ids[i : i + batch_size]
                pinecone_index.delete(ids=batch, namespace=namespace)
        else:
            # No known chunks — attempt to delete any vector ids that match the prefix by trying a namespace-wide delete
            try:
                # Some Pinecone clients support delete with an empty ids list or no args to clear namespace
                pinecone_index.delete(namespace=namespace)
            except Exception:
                # If that fails, just return True (best effort)
                pass

        return True

    except Exception as e:
        print(f"Pinecone Delete Error: {e}")
        return False