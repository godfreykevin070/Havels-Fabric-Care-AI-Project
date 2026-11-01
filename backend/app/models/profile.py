from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class UserProfile(Base):
    """Personalized washing-behaviour profile (Milestone 2 output)."""

    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    care_group = Column(String(48), default="Balanced Care", nullable=False)
    preferred_temp = Column(Integer, default=40)
    preferred_spin = Column(Integer, default=800)
    preferred_duration = Column(Integer, default=40)
    avg_load_size = Column(String(32), default="medium")
    detergent_preference = Column(String(64), nullable=True)

    total_washes = Column(Integer, default=0)
    total_feedbacks = Column(Integer, default=0)
    avg_cleaning_satisfaction = Column(Float, default=0.0)
    avg_defect_score = Column(Float, default=0.0)
    gentle_index = Column(Float, default=0.5)

    metrics = Column(JSON, default=dict)
    model_version = Column(String(32), default="v1-heuristic")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")