"""Feature engineering shared by profiling and adaptive learning."""
from app.rule_engine.knowledge_base import (
    COLOR_GROUPS,
    FABRIC_KNOWLEDGE,
    SOILING_ADJUSTMENTS,
)

FABRIC_KEYS: list[str] = sorted(FABRIC_KNOWLEDGE.keys())
COLOR_KEYS: list[str] = ["white", "light", "bright", "dark"]
SOILING_INDEX: dict[str, int] = {k: i for i, k in enumerate(SOILING_ADJUSTMENTS.keys())}

FEATURE_NAMES: list[str] = (
    [f"fabric_{f}" for f in FABRIC_KEYS]
    + [f"color_{c}" for c in COLOR_KEYS]
    + ["water_temp", "spin_rpm", "duration_min", "wash_count", "soiling"]
)
N_FEATURES = len(FEATURE_NAMES)


def build_feature_vector(row: dict) -> list[float]:
    """
    `row` requires: fabric_type, color_group, water_temp, spin_rpm,
    duration_min, wash_count (optional), soiling_level (optional).
    """
    vec: list[float] = [1.0 if row.get("fabric_type") == f else 0.0 for f in FABRIC_KEYS]
    vec += [1.0 if row.get("color_group") == c else 0.0 for c in COLOR_KEYS]
    vec += [
        float(row.get("water_temp", 30)) / 60.0,
        float(row.get("spin_rpm", 800)) / 1200.0,
        float(row.get("duration_min", 40)) / 120.0,
        min(float(row.get("wash_count", 0)), 100.0) / 100.0,
        SOILING_INDEX.get(row.get("soiling_level", "normal"), 1) / 3.0,
    ]
    return vec