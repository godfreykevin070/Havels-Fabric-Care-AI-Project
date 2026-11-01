"""Post-wash feedback capture → drives profiling and adaptive learning."""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Feedback, WashCycle
from app.services import lifecycle_service


def create_feedback(db: Session, payload) -> Feedback:
    lifecycle_service.get_user_or_404(db, payload.user_id)

    cycle: WashCycle | None = (
        db.query(WashCycle)
        .filter(WashCycle.id == payload.wash_cycle_id, WashCycle.user_id == payload.user_id)
        .first()
    )
    if cycle is None:
        raise HTTPException(
            status_code=404,
            detail=f"Wash cycle {payload.wash_cycle_id} not found for user {payload.user_id}",
        )

    if payload.garment_id is not None:
        lifecycle_service.get_garment_or_404(db, payload.garment_id)

    feedback = Feedback(
        user_id=payload.user_id,
        wash_cycle_id=payload.wash_cycle_id,
        garment_id=payload.garment_id,
        cleaning_satisfaction=payload.cleaning_satisfaction,
        fading=payload.fading,
        shrinkage=payload.shrinkage,
        roughness=payload.roughness,
        pilling=payload.pilling,
        color_loss=payload.color_loss,
        notes=payload.notes,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    if payload.garment_id is not None:
        garment = lifecycle_service.get_garment_or_404(db, payload.garment_id)
        lifecycle_service.recompute_garment_health(db, garment)

    return feedback


def list_feedback(db: Session, user_id: int, limit: int = 50) -> list[Feedback]:
    return (
        db.query(Feedback)
        .filter(Feedback.user_id == user_id)
        .order_by(Feedback.created_at.desc())
        .limit(limit)
        .all()
    )