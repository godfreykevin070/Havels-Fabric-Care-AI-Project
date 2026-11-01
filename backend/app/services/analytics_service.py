"""Consolidated dashboard aggregation (replaces the desirable AI dashboard deliverable)."""
import numpy as np
from sqlalchemy.orm import Session

from app.models import Feedback, Recommendation, WashCycle
from app.services import lifecycle_service, profile_service


def _round(value, ndigits=2):
    return round(float(value), ndigits)


def build_dashboard(db: Session, user_id: int) -> dict:
    user = lifecycle_service.get_user_or_404(db, user_id)
    profile = profile_service.get_profile(db, user_id)
    wardrobe = lifecycle_service.wardrobe_summary(db, user_id)

    cycles = (
        db.query(WashCycle)
        .filter(WashCycle.user_id == user_id)
        .order_by(WashCycle.created_at.desc())
        .limit(50)
        .all()
    )
    recommendations = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == user_id)
        .order_by(Recommendation.created_at.desc())
        .limit(10)
        .all()
    )
    feedbacks = db.query(Feedback).filter(Feedback.user_id == user_id).all()

    # ---------- usage analytics -------------------------------------------
    washes_by_fabric: dict[str, int] = {}
    total_wears = 0
    garments = db.query(lifecycle_service.Garment).filter(
        lifecycle_service.Garment.user_id == user_id
    ).all()
    total_wears = sum(g.wear_count for g in garments)

    for cycle in cycles:
        for link in cycle.garment_links:
            if link.garment:
                washes_by_fabric[link.garment.fabric_type] = (
                    washes_by_fabric.get(link.garment.fabric_type, 0) + 1
                )

    usage = {
        "total_washes": len(cycles),
        "total_wears": total_wears,
        "total_feedbacks": len(feedbacks),
        "avg_temp": _round(np.mean([c.water_temp for c in cycles]), 1) if cycles else 0.0,
        "avg_spin": _round(np.mean([c.spin_rpm for c in cycles]), 0) if cycles else 0.0,
        "avg_duration": _round(np.mean([c.duration_min for c in cycles]), 1) if cycles else 0.0,
        "avg_satisfaction": _round(
            np.mean([f.cleaning_satisfaction for f in feedbacks]), 2
        ) if feedbacks else 0.0,
        "washes_by_fabric": [
            {"fabric": f, "washes": c} for f, c in sorted(washes_by_fabric.items())
        ],
        "temp_trend": [
            {
                "date": c.created_at.strftime("%Y-%m-%d"),
                "water_temp": c.water_temp,
                "spin_rpm": c.spin_rpm,
            }
            for c in reversed(cycles[:20])
        ],
    }

    # ---------- alerts -----------------------------------------------------
    alerts: list[str] = []
    low_health = [g for g in garments if g.health_score < 60]
    if low_health:
        alerts.append(
            f"{len(low_health)} garment(s) below health score 60 — review care settings."
        )
    if feedbacks:
        worst = max(
            feedbacks,
            key=lambda f: f.fading + f.shrinkage + f.roughness + f.pilling + f.color_loss,
        )
        defect_total = (
            worst.fading + worst.shrinkage + worst.roughness + worst.pilling + worst.color_loss
        )
        if defect_total >= 8:
            alerts.append(
                "Recent feedback flags significant fabric damage — the adaptive engine "
                "will steer towards gentler settings."
            )
    if not recommendations:
        alerts.append("No pre-wash advisory generated yet — start from the Advisory tab.")

    return {
        "user": {"id": user.id, "name": user.name, "email": user.email},
        "profile": (
            {
                "care_group": profile.care_group,
                "preferred_temp": profile.preferred_temp,
                "preferred_spin": profile.preferred_spin,
                "preferred_duration": profile.preferred_duration,
                "gentle_index": profile.gentle_index,
                "model_version": profile.model_version,
                "avg_defect_score": profile.avg_defect_score,
                "avg_cleaning_satisfaction": profile.avg_cleaning_satisfaction,
                "updated_at": profile.updated_at.isoformat(),
            }
            if profile
            else None
        ),
        "wardrobe": wardrobe,
        "usage": usage,
        "recent_recommendations": [
            {
                "id": r.id,
                "engine": r.engine,
                "confidence": r.confidence,
                "accepted": r.accepted,
                "created_at": r.created_at.isoformat(),
                "settings": (r.payload or {}).get("settings", {}),
            }
            for r in recommendations
        ],
        "recent_wash_cycles": [
            {
                "id": c.id,
                "cycle_type": c.cycle_type,
                "water_temp": c.water_temp,
                "spin_rpm": c.spin_rpm,
                "duration_min": c.duration_min,
                "engine_used": c.engine_used,
                "created_at": c.created_at.isoformat(),
            }
            for c in cycles[:10]
        ],
        "alerts": alerts,
    }