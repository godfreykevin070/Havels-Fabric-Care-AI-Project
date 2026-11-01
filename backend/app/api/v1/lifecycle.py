from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services import lifecycle_service

router = APIRouter()


@router.get("/wardrobe/{user_id}")
def wardrobe(user_id: int, db: Session = Depends(get_db)):
    """Milestone 3: digital wardrobe with health scores."""
    return lifecycle_service.wardrobe_summary(db, user_id)