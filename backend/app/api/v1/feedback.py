from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.feedback import FeedbackCreate, FeedbackOut
from app.services import feedback_service

router = APIRouter()


@router.post("", response_model=FeedbackOut, status_code=201)
def create_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)):
    """Milestone 2: post-wash feedback capture."""
    return feedback_service.create_feedback(db, payload)


@router.get("", response_model=list[FeedbackOut])
def list_feedback(user_id: int = Query(...), limit: int = 50, db: Session = Depends(get_db)):
    return feedback_service.list_feedback(db, user_id, limit)