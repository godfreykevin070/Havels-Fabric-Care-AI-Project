from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FeedbackCreate(BaseModel):
    user_id: int
    wash_cycle_id: int
    garment_id: int | None = None
    cleaning_satisfaction: int = Field(ge=1, le=5)
    fading: int = Field(default=0, ge=0, le=3)
    shrinkage: int = Field(default=0, ge=0, le=3)
    roughness: int = Field(default=0, ge=0, le=3)
    pilling: int = Field(default=0, ge=0, le=3)
    color_loss: int = Field(default=0, ge=0, le=3)
    notes: str | None = None


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    wash_cycle_id: int
    garment_id: int | None
    cleaning_satisfaction: int
    fading: int
    shrinkage: int
    roughness: int
    pilling: int
    color_loss: int
    notes: str | None
    created_at: datetime