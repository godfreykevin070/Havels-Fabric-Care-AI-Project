from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.profile import TrainResult, UserProfileOut
from app.services import ml_service, profile_service

router = APIRouter()


@router.get("/{user_id}", response_model=UserProfileOut)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    return profile_service.get_or_create_profile(db, user_id)


@router.post("/{user_id}/rebuild", response_model=UserProfileOut)
def rebuild_profile(user_id: int, db: Session = Depends(get_db)):
    """Recompute behaviour metrics + care group (KMeans or heuristic)."""
    return profile_service.rebuild_profile(db, user_id)


@router.post("/{user_id}/train", response_model=TrainResult)
def train_adaptive_model(user_id: int, db: Session = Depends(get_db)):
    """Milestone 4: retrain the per-user adaptive recommendation model."""
    return ml_service.train_user_model(db, user_id)