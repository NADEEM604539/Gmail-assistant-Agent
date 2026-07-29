from pydantic import BaseModel, Field
from typing import Any

class UserPreference(BaseModel):
    preference_name: str = Field(..., max_length=255)
    preference_value: Any
    enabled: bool = True

class Enable_class(BaseModel):
    enabled:bool
