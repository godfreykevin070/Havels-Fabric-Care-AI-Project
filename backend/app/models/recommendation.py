from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Recommendation(Base):
    """A pre-wash advisory produced by the rule engine and/or adaptive engine."""

    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    engine = Column(String(32), default="rule", nullable=False)   # rule | adaptive
    confidence = Column(Float, default=0.8, nullable=False)
    accepted = Column(Boolean, default=False, nullable=False)
    payload = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="recommendations")