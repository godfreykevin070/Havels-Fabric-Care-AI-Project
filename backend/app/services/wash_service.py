"""Wash-cycle logging — feeds the LEARN and TRACK stages."""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Garment, WashCycle, WashCycleGarment
from app.services import advisory_service, lifecycle_service


def create_wash_cycle(db: Session, payload) -> dict:
    lifecycle_service.get_user_or_404(db, payload.user_id)

    cycle = WashCycle(
        user_id=payload.user_id,
        recommendation_id=payload.recommendation_id,
        cycle_type=payload.cycle_type,
        water_temp=payload.water_temp,
        spin_rpm=payload.spin_rpm,
        duration_min=payload.duration_min,
        detergent_type=payload.detergent_type,
        detergent_dose_ml=payload.detergent_dose_ml,
        load_size=payload.load_size,
        soiling_level=payload.soiling_level,
        engine_used=payload.engine_used,
    )
    db.add(cycle)
    db.flush()

    garment_ids: list[int] = []
    for gid in payload.garment_ids:
        garment: Garment | None = (
            db.query(Garment)
            .filter(Garment.id == gid, Garment.user_id == payload.user_id)
            .first()
        )
        if garment is None:
            raise HTTPException(
                status_code=404, detail=f"Garment {gid} not found for user {payload.user_id}"
            )
        db.add(
            WashCycleGarment(
                wash_cycle_id=cycle.id,
                garment_id=garment.id,
                wear_count_at_wash=garment.wear_count,
            )
        )
        garment.wash_count += 1
        garment.last_wash_at = cycle.created_at
        db.add(garment)
        garment_ids.append(garment.id)

    db.commit()
    db.refresh(cycle)

    # Recompute health after the counter updates
    for gid in garment_ids:
        lifecycle_service.recompute_garment_health(db, lifecycle_service.get_garment_or_404(db, gid))

    if payload.recommendation_id:
        advisory_service.mark_accepted(db, payload.recommendation_id)

    return {
        "id": cycle.id,
        "user_id": cycle.user_id,
        "cycle_type": cycle.cycle_type,
        "water_temp": cycle.water_temp,
        "spin_rpm": cycle.spin_rpm,
        "duration_min": cycle.duration_min,
        "detergent_type": cycle.detergent_type,
        "load_size": cycle.load_size,
        "soiling_level": cycle.soiling_level,
        "engine_used": cycle.engine_used,
        "created_at": cycle.created_at,
        "garment_ids": garment_ids,
    }


def list_wash_cycles(db: Session, user_id: int, limit: int = 25) -> list[WashCycle]:
    return (
        db.query(WashCycle)
        .filter(WashCycle.user_id == user_id)
        .order_by(WashCycle.created_at.desc())
        .limit(limit)
        .all()
    )