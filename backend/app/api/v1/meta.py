from fastapi import APIRouter

from app.rule_engine.engine import RuleEngine
from app.rule_engine.knowledge_base import COLOR_GROUPS, LOAD_SIZES, SOILING_LEVELS

router = APIRouter()


@router.get("/fabrics")
def fabrics():
    """Fabric knowledge base exposed to the UI (Milestone 1 — INFORM)."""
    return {"fabrics": RuleEngine.catalogue()}


@router.get("/enums")
def enums():
    return {
        "color_groups": COLOR_GROUPS,
        "soiling_levels": SOILING_LEVELS,
        "load_sizes": LOAD_SIZES,
        "care_groups": ["Gentle Care", "Balanced Care", "Performance Care"],
    }