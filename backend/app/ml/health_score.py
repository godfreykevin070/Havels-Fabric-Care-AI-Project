"""
Fabric Health Score & Garment Lifecycle Management — Milestone 3 (TRACK).

Combines mechanical wear (wear/wash counts), chronological ageing and
observed fabric damage (post-wash feedback) into a 0–100 score.
"""
from datetime import date

from app.rule_engine.knowledge_base import get_fabric_profile

DEFECT_KEYS = ("fading", "shrinkage", "roughness", "pilling", "color_loss")


def compute_health_score(
    fabric_type: str,
    wear_count: int = 0,
    wash_count: int = 0,
    age_days: int = 0,
    avg_defect: float | None = None,
) -> float:
    """Return a 0–100 fabric health score (higher = healthier)."""
    durability = get_fabric_profile(fabric_type).durability
    fragility = 1.0 - durability

    wear_penalty = wear_count * (0.35 + 0.65 * fragility)
    wash_penalty = wash_count * (0.70 + 1.60 * fragility)
    age_penalty = age_days * 0.015
    defect_penalty = (avg_defect or 0.0) * 9.0

    score = 100.0 - wear_penalty - wash_penalty - age_penalty - defect_penalty
    return round(max(0.0, min(100.0, score)), 2)


def health_band(score: float) -> str:
    if score >= 80:
        return "Excellent"
    if score >= 60:
        return "Good"
    if score >= 40:
        return "Fair"
    if score >= 20:
        return "Worn"
    return "End-of-life"


def health_drivers(
    fabric_type: str,
    wear_count: int,
    wash_count: int,
    age_days: int,
    avg_defect: float | None,
) -> list[str]:
    drivers: list[str] = []
    profile = get_fabric_profile(fabric_type)
    if wash_count >= 30:
        drivers.append(f"High wash count ({wash_count}) — cumulative mechanical stress.")
    elif wash_count >= 15:
        drivers.append(f"Moderate wash count ({wash_count}).")
    if wear_count >= 60:
        drivers.append(f"Heavy wear usage ({wear_count} wears).")
    if age_days >= 730:
        drivers.append(f"Garment is {age_days // 365} years old — fibre ageing.")
    if avg_defect is not None and avg_defect >= 0.8:
        drivers.append(f"Feedback indicates visible damage (avg defect {avg_defect:.2f}/3).")
    if profile.durability <= 0.45:
        drivers.append(f"{profile.label} is an inherently delicate fibre.")
    if not drivers:
        drivers.append("No adverse wear signals detected.")
    return drivers


def care_recommendation(score: float, fabric_type: str) -> str:
    profile = get_fabric_profile(fabric_type)
    if score >= 80:
        return f"Standard care is fine — continue the '{profile.cycle_type}' cycle."
    if score >= 60:
        return "Keep the current cycle but avoid maximum spin speed."
    if score >= 40:
        return (
            f"Shift to a gentler regime: max 30°C, spin ≤ 600 RPM, "
            f"and use '{profile.detergent}'."
        )
    if score >= 20:
        return "Consider hand-washing or a dedicated delicate cycle; avoid tumble drying."
    return "Fabric is near end-of-life — repurpose, repair, or retire the garment."


def age_days_from(purchase_date: date | None, fallback_days: int = 0) -> int:
    if purchase_date is None:
        return fallback_days
    return max(0, (date.today() - purchase_date).days)