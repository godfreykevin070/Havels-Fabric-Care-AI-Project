from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    household_id: str | None = None
    age_group: str | None = None
    region: str | None = None
    preferences: dict[str, Any] = {}


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    household_id: str | None = None
    age_group: str | None = None
    region: str | None = None
    preferences: dict[str, Any] = {}
    created_at: datetime