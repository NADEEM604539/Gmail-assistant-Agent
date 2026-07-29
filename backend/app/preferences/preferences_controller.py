from fastapi import APIRouter, Depends
from app.auth.jwt.service import get_current_user
from sqlalchemy import text
from app.preferences.preferences_service import getPreferences, add_preference, update_preference, delete_preference, toggle_preference_status
from app.preferences.DTO import UserPreference, Enable_class


router = APIRouter(
    prefix='/preferences',
    tags=['preferences']
)


@router.get('/')
def preferences(current_user=Depends(get_current_user)):
    preferences = getPreferences(current_user["user_id"])
    return preferences

@router.post('/')
def addPreference(preference_data:UserPreference, current_user=Depends(get_current_user)):
    preference = add_preference(user_id=current_user["user_id"], preference=preference_data)
    return preference

@router.put('/{id}')
def update_preferences(preference_data:UserPreference, id:str, current_user=Depends(get_current_user)):
    preference = update_preference(preference_id=id, user_id=current_user["user_id"], preference=preference_data)
    return preference

@router.patch('/{id}')
def update_preferences(enable:Enable_class, id:str, current_user=Depends(get_current_user)):
    preference = toggle_preference_status(preference_id=id, user_id=current_user["user_id"], enabled=enable.enabled)
    return preference

@router.delete('/{id}')
def deletePreference(id:str, current_user=Depends(get_current_user)):
    del_preference = delete_preference(preference_id=id, user_id=current_user["user_id"])
    return del_preference
