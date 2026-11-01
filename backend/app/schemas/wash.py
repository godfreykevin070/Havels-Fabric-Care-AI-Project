from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WashCycleCreate(BaseModel):
    user_id: int
    garment_ids: list[int] = []
    cycle_type: str
    water_temp: int
    spin_rpm: int
    duration_min: int
    detergent_type: str | None = None
    detergent_dose_ml: float | None = None
    load_size: str = "medium"
    soiling_level: str = "normal"
    engine_used: str = "rule"
    recommendation_id: int | None = None


class WashCycleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    cycle_type: str
    water_temp: int
    spin_rpm: int
    duration_min: int
    detergent_type: str | None = None
    load_size: str
    soiling_level: str
    engine_used: str
    created_at: datetime
    garment_ids: list[int] = []