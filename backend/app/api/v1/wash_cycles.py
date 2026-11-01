from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.wash import WashCycleCreate, WashCycleOut
from app.services import wash_service

router = APIRouter()


@router.post("", response_model=WashCycleOut, status_code=201)
def create_wash_cycle(payload: WashCycleCreate, db: Session = Depends(get_db)):
    return wash_service.create_wash_cycle(db, payload)


@router.get("", response_model=list[WashCycleOut])
def list_wash_cycles(
    user_id: int = Query(...), limit: int = 25, db: Session = Depends(get_db)
):
    cycles = wash_service.list_wash_cycles(db, user_id, limit)
    return [
        WashCycleOut(
            id=c.id,
            user_id=c.user_id,
            cycle_type=c.cycle_type,
            water_temp=c.water_temp,
            spin_rpm=c.spin_rpm,
            duration_min=c.duration_min,
            detergent_type=c.detergent_type,
            load_size=c.load_size,
            soiling_level=c.soiling_level,
            engine_used=c.engine_used,
            created_at=c.created_at,
            garment_ids=[link.garment_id for link in c.garment_links],
        )
        for c in cycles
    ]