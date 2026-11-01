"""Pre-wash advisory orchestration: rule engine → adaptive optimiser → persistence."""
import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.ml.adaptive import AdaptiveEngine
from app.models import Garment, Recommendation, User
from app.rule_engine.engine import RuleContext, RuleEngine

logger = logging.getLogger(__name__)
rule_engine = RuleEngine()
adaptive_engine = AdaptiveEngine()


def _anchor_garments(db: Session, user_id: int, garment_ids: list[int]) -> list[Garment]:
    query = db.query(Garment).filter(Garment.user_id == user_id)
    if garment_ids:
        garments = query.filter(Garment.id.in_(garment_ids)).all()
        missing = set(garment_ids) - {g.id for g in garments}
        if missing:
            raise HTTPException(
                status_code=404, detail=f"Garments not found for this user: {sorted(missing)}"
            )
        return garments
    return query.all()


def generate_advisory(db: Session, payload) -> dict:
    user: User | None = db.get(User, payload.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail=f"User {payload.user_id} not found")

    garments = _anchor_garments(db, payload.user_id, payload.garment_ids)

    fabric_types = [g.fabric_type for g in garments] or ["cotton"]
    anchor_fabric = RuleEngine.most_delicate(fabric_types)
    anchor = next((g for g in garments if g.fabric_type == anchor_fabric), None)

    ctx = RuleContext(
        fabric_type=anchor_fabric,
        color_group=anchor.color_group if anchor else "light",
        soiling_level=payload.soiling_level,
        load_size=payload.load_size,
        wash_count=anchor.wash_count if anchor else 0,
        wear_count=anchor.wear_count if anchor else 0,
        health_score=anchor.health_score if anchor else 100.0,
    )

    base = rule_engine.recommend(ctx)

    settings = base.settings()
    alerts = list(base.alerts)
    reasons = list(base.reasons)
    confidence = base.confidence
    engine = "rule"
    adaptive_applied = False
    adaptive_meta: dict | None = None

    # ---------- Milestone 4: adaptive optimisation -------------------------
    if payload.use_adaptive and adaptive_engine.is_trained(payload.user_id):
        adaptive_meta = adaptive_engine.optimize(
            payload.user_id,
            base={
                "water_temp": base.water_temp,
                "spin_rpm": base.spin_rpm,
                "duration_min": base.duration_min,
            },
            context={
                "fabric_type": anchor_fabric,
                "color_group": ctx.color_group,
                "wash_count": ctx.wash_count,
                "soiling_level": payload.soiling_level,
                "min_temp_c": base.bounds["min_temp_c"],
                "max_temp_c": base.bounds["max_temp_c"],
                "max_spin_rpm": base.bounds["max_spin_rpm"],
            },
        )

        if adaptive_meta:
            settings["water_temp"] = adaptive_meta["water_temp"]
            settings["spin_rpm"] = adaptive_meta["spin_rpm"]
            settings["duration_min"] = adaptive_meta["duration_min"]
            engine = "adaptive"
            adaptive_applied = True
            confidence = round(min(0.96, confidence + 0.05), 2)
            reasons.append(
                "Adaptive engine refined the settings using "
                f"{adaptive_meta['n_samples']} of your past wash-feedback records "
                f"(Δtemp {adaptive_meta['delta_temp']:+d}°C, "
                f"Δspin {adaptive_meta['delta_spin']:+d} RPM, "
                f"Δduration {adaptive_meta['delta_duration']:+d} min)."
            )
            if adaptive_meta["changed"]:
                alerts.append(
                    "Settings adjusted from your history to reduce observed fabric damage."
                )

    # ---------- Per-garment guidance --------------------------------------
    per_garment = []
    for g in garments:
        g_ctx = RuleContext(
            fabric_type=g.fabric_type,
            color_group=g.color_group,
            soiling_level=payload.soiling_level,
            load_size=payload.load_size,
            wash_count=g.wash_count,
            wear_count=g.wear_count,
            health_score=g.health_score,
        )
        g_result = rule_engine.recommend(g_ctx)
        per_garment.append(
            {
                "garment_id": g.id,
                "name": g.name,
                "fabric_type": g.fabric_type,
                "water_temp": g_result.water_temp,
                "spin_rpm": g_result.spin_rpm,
                "duration_min": g_result.duration_min,
                "cycle_type": g_result.cycle_type,
                "alerts": g_result.alerts,
            }
        )

    payload_json = {
        "settings": settings,
        "alerts": alerts,
        "reasons": reasons,
        "per_garment": per_garment,
        "adaptive_applied": adaptive_applied,
        "adaptive_meta": adaptive_meta,
        "context": {
            "anchor_fabric": anchor_fabric,
            "soiling_level": payload.soiling_level,
            "load_size": payload.load_size,
            "garment_ids": [g.id for g in garments],
        },
        "bounds": base.bounds,
    }

    record = Recommendation(
        user_id=payload.user_id,
        engine=engine,
        confidence=confidence,
        payload=payload_json,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "engine": engine,
        "confidence": confidence,
        "created_at": record.created_at,
        "adaptive_applied": adaptive_applied,
        "alerts": alerts,
        "reasons": reasons,
        "per_garment": per_garment,
        **settings,
    }


def mark_accepted(db: Session, recommendation_id: int) -> None:
    rec = db.get(Recommendation, recommendation_id)
    if rec is not None:
        rec.accepted = True
        db.add(rec)
        db.commit()


def history(db: Session, user_id: int, limit: int = 20) -> list[Recommendation]:
    return (
        db.query(Recommendation)
        .filter(Recommendation.user_id == user_id)
        .order_by(Recommendation.created_at.desc())
        .limit(limit)
        .all()
    )