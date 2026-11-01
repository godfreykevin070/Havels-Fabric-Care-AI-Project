from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Feedback(Base):
    """
    Post-wash feedback. Defect scales are 0 (none) .. 3 (severe).
    cleaning_satisfaction is 1 (poor) .. 5 (excellent).
    """

    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    wash_cycle_id = Column(
        Integer, ForeignKey("wash_cycles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    garment_id = Column(Integer, ForeignKey("garments.id", ondelete="CASCADE"), nullable=True, index=True)

    cleaning_satisfaction = Column(Integer, nullable=False)
    fading = Column(Integer, default=0, nullable=False)
    shrinkage = Column(Integer, default=0, nullable=False)
    roughness = Column(Integer, default=0, nullable=False)
    pilling = Column(Integer, default=0, nullable=False)
    color_loss = Column(Integer, default=0, nullable=False)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="feedbacks")
    wash_cycle = relationship("WashCycle", back_populates="feedbacks")
    garment = relationship("Garment", back_populates="feedbacks")