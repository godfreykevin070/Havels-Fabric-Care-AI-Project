from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.advisory import AdvisoryRequest, AdvisoryResponse, RecommendationHistoryItem
from app.services import advisory_service

router = APIRouter()


@router.post("/recommend", response_model=AdvisoryResponse)
def recommend(payload: AdvisoryRequest, db: Session = Depends(get_db)):
    """Milestone 1 + 4: rule-based advisory refined by adaptive learning."""
    return advisory_service.generate_advisory(db, payload)


@router.get("/history", response_model=list[RecommendationHistoryItem])
def history(user_id: int = Query(...), limit: int = 20, db: Session = Depends(get_db)):
    return advisory_service.history(db, user_id, limit)