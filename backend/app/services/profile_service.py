"""Personalized profile rebuild — Milestone 2 (LEARN)."""
import logging

from sqlalchemy.orm import Session

from app.ml.profiling import cluster_care_groups, compute_metrics, preferred_settings
from app.models import Feedback, Garment, UserProfile, WashCycle
from app.services import lifecycle_service

logger = logging.getLogger(__name__)


def _raw_history(db: Session, user_id: int):
    cycles = db.query(WashCycle).filter(WashCycle.user_id == user_id).all()
    feedbacks = db.query(Feedback).filter(Feedback.user_id == user_id).all()
    garments = db.query(Garment).filter(Garment.user_id == user_id).all()
    return cycles, feedbacks, garments


def rebuild_profile(db: Session, user_id: int) -> UserProfile:
    lifecycle_service.get_user_or_404(db, user_id)

    # -------- compute metrics for every user so KMeans has a population ----
    all_users = db.query(Garment.user_id).distinct().all()
    metrics_by_user: dict[int, dict] = {}
    for (uid,) in all_users:
        cycles, feedbacks, garments = _raw_history(db, uid)
        metrics_by_user[uid] = compute_metrics(cycles, feedbacks, garments)

    if user_id not in metrics_by_user:
        metrics_by_user[user_id] = compute_metrics([], [], [])

    user_ids = list(metrics_by_user.keys())
    metrics_list = [metrics_by_user[u] for u in user_ids]
    groups = cluster_care_groups(metrics_list)
    group = groups[user_ids.index(user_id)]
    metrics = metrics_by_user[user_id]

    model_version = (
        "v2-kmeans" if len(metrics_list) >= 8 else "v1-heuristic"
    )

    profile = (
        db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    )
    if profile is None:
        profile = UserProfile(user_id=user_id)
        db.add(profile)

    prefs = preferred_settings(metrics, group)
    profile.care_group = group
    profile.preferred_temp = prefs["preferred_temp"]
    profile.preferred_spin = prefs["preferred_spin"]
    profile.preferred_duration = prefs["preferred_duration"]
    profile.total_washes = metrics["total_washes"]
    profile.total_feedbacks = metrics["total_feedbacks"]
    profile.avg_cleaning_satisfaction = metrics["avg_cleaning_satisfaction"]
    profile.avg_defect_score = metrics["avg_defect"]
    profile.gentle_index = metrics["gentle_index"]
    profile.metrics = metrics
    profile.model_version = model_version

    db.commit()
    db.refresh(profile)
    logger.info("Rebuilt profile for user %s → %s (%s)", user_id, group, model_version)
    return profile


def get_profile(db: Session, user_id: int) -> UserProfile | None:
    return db.query(UserProfile).filter(UserProfile.user_id == user_id).first()


def get_or_create_profile(db: Session, user_id: int) -> UserProfile:
    profile = get_profile(db, user_id)
    if profile is None:
        profile = rebuild_profile(db, user_id)
    return profile