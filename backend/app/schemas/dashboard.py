from typing import Any

from pydantic import BaseModel


class DashboardResponse(BaseModel):
    user: dict[str, Any]
    profile: dict[str, Any] | None
    wardrobe: dict[str, Any]
    usage: dict[str, Any]
    recent_recommendations: list[dict[str, Any]]
    recent_wash_cycles: list[dict[str, Any]]
    alerts: list[str]