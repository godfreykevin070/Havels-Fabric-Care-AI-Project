from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Garment(Base):
    """A physical garment registered in the user's digital wardrobe (Milestone 3)."""

    __tablename__ = "garments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(160), nullable=False)
    fabric_type = Column(String(64), nullable=False, index=True)
    color_group = Column(String(32), default="light", nullable=False)
    brand = Column(String(120), nullable=True)
    care_label = Column(JSON, default=dict)

    purchase_date = Column(Date, nullable=True)
    wear_count = Column(Integer, default=0, nullable=False)
    wash_count = Column(Integer, default=0, nullable=False)
    health_score = Column(Float, default=100.0, nullable=False)

    last_worn_at = Column(DateTime, nullable=True)
    last_wash_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="garments")
    wash_links = relationship(
        "WashCycleGarment", back_populates="garment", cascade="all, delete-orphan"
    )
    feedbacks = relationship("Feedback", back_populates="garment", cascade="all, delete-orphan")