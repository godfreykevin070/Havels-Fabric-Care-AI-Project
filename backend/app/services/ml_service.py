"""Training-data assembly for the adaptive engine."""
from sqlalchemy.orm import Session

from app.ml.adaptive import AdaptiveEngine
from app.models import Feedback, WashCycle
from app.services import lifecycle_service

adaptive_engine = AdaptiveEngine()


def build_training_samples(db: Session, user_id: int) -> list[dict]:
    """
    Join each feedback record with its wash cycle and (optionally) the
    garment it refers to, producing one supervised sample per record.
    """
    rows = (
        db.query(Feedback, WashCycle)
        .join(WashCycle, Feedback.wash_cycle_id == WashCycle.id)
        .filter(Feedback.user_id == user_id)
        .all()
    )

    samples: list[dict] = []
    for feedback, cycle in rows:
        garment = feedback.garment
        if garment is None:
            # Fall back to the first garment in the wash, else skip
            link = cycle.garment_links[0] if cycle.garment_links else None
            garment = link.garment if link else None
        if garment is None:
            continue

        samples.append(
            {
                "fabric_type": garment.fabric_type,
                "color_group": garment.color_group,
                "water_temp": cycle.water_temp,
                "spin_rpm": cycle.spin_rpm,
                "duration_min": cycle.duration_min,
                "wash_count": garment.wash_count,
                "soiling_level": cycle.soiling_level or "normal",
                "fading": feedback.fading,
                "shrinkage": feedback.shrinkage,
                "roughness": feedback.roughness,
                "pilling": feedback.pilling,
                "color_loss": feedback.color_loss,
                "cleaning_satisfaction": feedback.cleaning_satisfaction,
            }
        )
    return samples


def train_user_model(db: Session, user_id: int) -> dict:
    lifecycle_service.get_user_or_404(db, user_id)
    samples = build_training_samples(db, user_id)
    return adaptive_engine.train(user_id, samples)


def model_status(user_id: int) -> dict:
    return {
        "user_id": user_id,
        "trained": adaptive_engine.is_trained(user_id),
    }