from fastapi import APIRouter, Depends
from app.auth.jwt.service import get_current_user
from app.stats.stats_service import get_dashboard_stats

router = APIRouter(
    prefix='/stats',
    tags=['stats']
)


@router.get('/dashboard/gmail')
def dashboard_stats(
    current_user = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    return {
        "stats": get_dashboard_stats(user_id=user_id)
    }