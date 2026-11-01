from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    care_group: str
    preferred_temp: int
    preferred_spin: int
    preferred_duration: int
    avg_load_size: str
    detergent_preference: str | None
    total_washes: int
    total_feedbacks: int
    avg_cleaning_satisfaction: float
    avg_defect_score: float
    gentle_index: float
    metrics: dict
    model_version: str
    updated_at: datetime


class TrainResult(BaseModel):
    trained: bool
    n_samples: int
    trained_at: str | None = None
    reason: str | None = None