from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.dashboard import DashboardResponse
from app.services import analytics_service

router = APIRouter()


@router.get("/{user_id}", response_model=DashboardResponse)
def dashboard(user_id: int, db: Session = Depends(get_db)):
    return analytics_service.build_dashboard(db, user_id)