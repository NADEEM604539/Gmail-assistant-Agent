from fastapi import APIRouter, Depends, Request , HTTPException, Form, File, UploadFile
from app.auth.auth_service import googleLogin
from app.auth.jwt.service import get_current_user
from app. embeddings.embed_service import get_embed_docs, add_embed_docs, delete_doc
from typing import Optional
router = APIRouter(
    prefix='/embed',
    tags=['gmail']
)

@router.get('/')
def get_docs(current_user = Depends(get_current_user)):
    docs = get_embed_docs(user_id=current_user["user_id"])
    return docs


@router.post('/')
def add_docs(
    file: UploadFile = File(...), 
    purpose: Optional[str] = Form(None), 
    current_user = Depends(get_current_user)
):
    docs = add_embed_docs(file=file, purpose=purpose, user_id=current_user["user_id"])
    return docs



@router.delete('/{id}')
def del_docs(id: int, current_user = Depends(get_current_user)):
    delete_docs = delete_doc(user_id=current_user["user_id"], doc_id=id)
    return delete_docs
