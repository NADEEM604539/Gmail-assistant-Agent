from fastapi import APIRouter, Depends, Query

from app.auth.jwt.service import get_current_user
from app.search.search_service import get_recent_searches, log_search_query, search_gmail

router = APIRouter(prefix='/search', tags=['search'])


@router.get('/gmail')
def search_gmail_endpoint(
    q: str = Query(default="", alias="q"),
    limit: int = Query(default=20, ge=1, le=50),
    current_user=Depends(get_current_user),
):
    user_id = current_user["user_id"]
    result = search_gmail(user_id=user_id, query=q, limit=limit)
    log_search_query(
        user_id=user_id,
        query=q,
        result_count=result["result_count"],
        is_ai_query=bool(q),
    )
    return result


@router.get('/recent')
def recent_searches(current_user=Depends(get_current_user)):
    return {"recent": get_recent_searches(user_id=current_user["user_id"])}
