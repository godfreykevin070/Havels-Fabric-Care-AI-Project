"""Garment registration, wear/wash tracking and health recomputation."""
from datetime import date, datetime

import numpy as np
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.ml.health_score import (
    DEFECT_KEYS,
    age_days_from,
    care_recommendation,
    compute_health_score,
    health_band,
    health_drivers,
)
from app.models import Garment, User


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    return user


def get_garment_or_404(db: Session, garment_id: int) -> Garment:
    garment = db.get(Garment, garment_id)
    if garment is None:
        raise HTTPException(status_code=404, detail=f"Garment {garment_id} not found")
    return garment


def create_garment(db: Session, payload) -> Garment:
    get_user_or_404(db, payload.user_id)
    garment = Garment(
        user_id=payload.user_id,
        name=payload.name,
        fabric_type=payload.fabric_type.strip().lower(),
        color_group=payload.color_group,
        brand=payload.brand,
        care_label=payload.care_label or {},
        purchase_date=payload.purchase_date,
    )
    garment.health_score = compute_health_score(
        fabric_type=garment.fabric_type,
        wear_count=0,
        wash_count=0,
        age_days=age_days_from(garment.purchase_date),
        avg_defect=0.0,
    )
    db.add(garment)
    db.commit()
    db.refresh(garment)
    return garment


def avg_defect_for_garment(db: Session, garment_id: int) -> float | None:
    from app.models import Feedback

    rows = db.query(Feedback).filter(Feedback.garment_id == garment_id).all()
    if not rows:
        return None
    values = [
        (f.fading + f.shrinkage + f.roughness + f.pilling + f.color_loss) / len(DEFECT_KEYS)
        for f in rows
    ]
    return float(np.mean(values))


def recompute_garment_health(db: Session, garment: Garment) -> Garment:
    garment.health_score = compute_health_score(
        fabric_type=garment.fabric_type,
        wear_count=garment.wear_count,
        wash_count=garment.wash_count,
        age_days=age_days_from(garment.purchase_date),
        avg_defect=avg_defect_for_garment(db, garment.id),
    )
    db.add(garment)
    db.commit()
    db.refresh(garment)
    return garment


def log_wear(db: Session, garment_id: int) -> Garment:
    garment = get_garment_or_404(db, garment_id)
    garment.wear_count += 1
    garment.last_worn_at = datetime.utcnow()
    db.add(garment)
    db.commit()
    return recompute_garment_health(db, garment)


def health_detail(db: Session, garment_id: int) -> dict:
    garment = get_garment_or_404(db, garment_id)
    avg_defect = avg_defect_for_garment(db, garment.id)
    age = age_days_from(garment.purchase_date)
    return {
        "garment_id": garment.id,
        "name": garment.name,
        "fabric_type": garment.fabric_type,
        "health_score": garment.health_score,
        "band": health_band(garment.health_score),
        "drivers": health_drivers(
            garment.fabric_type, garment.wear_count, garment.wash_count, age, avg_defect
        ),
        "recommendation": care_recommendation(garment.health_score, garment.fabric_type),
    }


def wardrobe_summary(db: Session, user_id: int) -> dict:
    get_user_or_404(db, user_id)
    garments = db.query(Garment).filter(Garment.user_id == user_id).all()

    if not garments:
        return {
            "total_garments": 0,
            "average_health": 0.0,
            "by_fabric": [],
            "health_distribution": [],
            "items": [],
        }

    by_fabric: dict[str, list[Garment]] = {}
    for g in garments:
        by_fabric.setdefault(g.fabric_type, []).append(g)

    buckets = [(0, 20), (20, 40), (40, 60), (60, 80), (80, 101)]
    distribution = [
        {
            "bucket": f"{low}-{high if high <= 100 else 100}",
            "count": sum(1 for g in garments if low <= g.health_score < high),
        }
        for low, high in buckets
    ]

    return {
        "total_garments": len(garments),
        "average_health": round(float(np.mean([g.health_score for g in garments])), 2),
        "by_fabric": [
            {
                "fabric": fabric,
                "count": len(items),
                "avg_health": round(float(np.mean([g.health_score for g in items])), 2),
                "total_washes": sum(g.wash_count for g in items),
            }
            for fabric, items in sorted(by_fabric.items())
        ],
        "health_distribution": distribution,
        "items": [
            {
                "id": g.id,
                "name": g.name,
                "fabric_type": g.fabric_type,
                "color_group": g.color_group,
                "wear_count": g.wear_count,
                "wash_count": g.wash_count,
                "health_score": g.health_score,
                "band": health_band(g.health_score),
                "age_days": age_days_from(g.purchase_date),
            }
            for g in sorted(garments, key=lambda x: x.health_score)
        ],
    }