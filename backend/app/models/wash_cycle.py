from datetime import datetime

from sqlalchemy import (
    Column, DateTime, Float, ForeignKey, Integer, JSON, String, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class WashCycle(Base):
    """A logged wash event — the raw material for the LEARN stage."""

    __tablename__ = "wash_cycles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"), nullable=True)

    cycle_type = Column(String(64), nullable=False)
    water_temp = Column(Integer, nullable=False)          # °C
    spin_rpm = Column(Integer, nullable=False)
    duration_min = Column(Integer, nullable=False)
    detergent_type = Column(String(64), nullable=True)
    detergent_dose_ml = Column(Float, nullable=True)
    load_size = Column(String(32), default="medium")
    soiling_level = Column(String(32), default="normal")
    engine_used = Column(String(32), default="rule")       # rule | adaptive

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="wash_cycles")
    garment_links = relationship(
        "WashCycleGarment", back_populates="wash_cycle", cascade="all, delete-orphan"
    )
    feedbacks = relationship("Feedback", back_populates="wash_cycle", cascade="all, delete-orphan")


class WashCycleGarment(Base):
    """Association object: which garments went into which wash, and how worn they were."""

    __tablename__ = "wash_cycle_garments"
    __table_args__ = (UniqueConstraint("wash_cycle_id", "garment_id", name="uq_wash_garment"),)

    id = Column(Integer, primary_key=True)
    wash_cycle_id = Column(
        Integer, ForeignKey("wash_cycles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    garment_id = Column(
        Integer, ForeignKey("garments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    wear_count_at_wash = Column(Integer, default=0)

    wash_cycle = relationship("WashCycle", back_populates="garment_links")
    garment = relationship("Garment", back_populates="wash_links")