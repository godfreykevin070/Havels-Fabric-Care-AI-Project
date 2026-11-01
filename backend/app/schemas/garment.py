from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class GarmentCreate(BaseModel):
    user_id: int
    name: str
    fabric_type: str
    color_group: str = Field(default="light", description="white | light | bright | dark")
    brand: str | None = None
    care_label: dict[str, Any] = {}
    purchase_date: date | None = None


class GarmentUpdate(BaseModel):
    name: str | None = None
    color_group: str | None = None
    care_label: dict[str, Any] | None = None


class GarmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    fabric_type: str
    color_group: str
    brand: str | None = None
    care_label: dict[str, Any] = {}
    purchase_date: date | None = None
    wear_count: int
    wash_count: int
    health_score: float
    last_worn_at: datetime | None = None
    last_wash_at: datetime | None = None
    created_at: datetime


class GarmentHealthOut(BaseModel):
    garment_id: int
    name: str
    fabric_type: str
    health_score: float
    band: str
    drivers: list[str]
    recommendation: str