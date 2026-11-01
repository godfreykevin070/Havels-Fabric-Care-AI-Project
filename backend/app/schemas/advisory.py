from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AdvisoryRequest(BaseModel):
    user_id: int
    garment_ids: list[int] = []
    soiling_level: str = "normal"          # light | normal | heavy | stain
    load_size: str = "medium"              # small | medium | large
    use_adaptive: bool = True


class PerGarmentAdvice(BaseModel):
    garment_id: int
    name: str
    fabric_type: str
    water_temp: int
    spin_rpm: int
    duration_min: int
    cycle_type: str
    alerts: list[str] = []


class AdvisoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    engine: str
    confidence: float
    cycle_type: str
    water_temp: int
    spin_rpm: int
    duration_min: int
    detergent: str
    drying: str
    ironing: str
    alerts: list[str] = []
    reasons: list[str] = []
    per_garment: list[PerGarmentAdvice] = []
    adaptive_applied: bool = False
    created_at: datetime | None = None


class RecommendationHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    engine: str
    confidence: float
    accepted: bool
    created_at: datetime
    payload: dict