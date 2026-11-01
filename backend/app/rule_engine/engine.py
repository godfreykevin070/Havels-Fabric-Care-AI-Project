"""
Rule-based Fabric Care Advisor — Milestone 1 (INFORM).

Produces deterministic, explainable pre-wash recommendations:
cycle type, water temperature, spin RPM, wash duration, detergent,
drying/ironing guidance, alerts and the reasoning trail.
"""
from dataclasses import dataclass, field, asdict

from app.rule_engine.knowledge_base import (
    COLOR_ADJUSTMENTS,
    FABRIC_KNOWLEDGE,
    LOAD_ADJUSTMENTS,
    SOILING_ADJUSTMENTS,
    get_fabric_profile,
)


def _clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


@dataclass
class RuleContext:
    fabric_type: str
    color_group: str = "light"
    soiling_level: str = "normal"
    load_size: str = "medium"
    wash_count: int = 0
    wear_count: int = 0
    health_score: float = 100.0


@dataclass
class RuleResult:
    cycle_type: str
    water_temp: int
    spin_rpm: int
    duration_min: int
    detergent: str
    drying: str
    ironing: str
    alerts: list[str] = field(default_factory=list)
    reasons: list[str] = field(default_factory=list)
    confidence: float = 0.85
    fabric_key: str = ""
    bounds: dict = field(default_factory=dict)

    def settings(self) -> dict:
        return {
            "cycle_type": self.cycle_type,
            "water_temp": self.water_temp,
            "spin_rpm": self.spin_rpm,
            "duration_min": self.duration_min,
            "detergent": self.detergent,
            "drying": self.drying,
            "ironing": self.ironing,
        }

    def to_dict(self) -> dict:
        data = asdict(self)
        data["settings"] = self.settings()
        return data


class RuleEngine:
    """Deterministic fabric-care rule engine."""

    def recommend(self, ctx: RuleContext) -> RuleResult:
        profile = get_fabric_profile(ctx.fabric_type)
        reasons: list[str] = []
        alerts: list[str] = list(profile.alerts)
        confidence = 0.88

        cycle = profile.cycle_type
        temp = profile.base_temp_c
        spin = profile.base_spin_rpm
        duration = profile.base_duration_min

        reasons.append(
            f"Base rule for {profile.label}: {temp}°C, {spin} RPM, "
            f"{duration} min on '{cycle}'."
        )

        # ---- 1. Colour adjustment -------------------------------------------
        color_rule = COLOR_ADJUSTMENTS.get(ctx.color_group, COLOR_ADJUSTMENTS["light"])
        if color_rule["temp_delta"]:
            temp += color_rule["temp_delta"]
            reasons.append(
                f"Colour group '{ctx.color_group}': temperature adjusted "
                f"{color_rule['temp_delta']:+d}°C to protect dye."
            )
        if color_rule["spin_cap"] is not None and spin > color_rule["spin_cap"]:
            spin = color_rule["spin_cap"]
            reasons.append(
                f"Spin capped at {spin} RPM for colour group '{ctx.color_group}'."
            )
        alerts.extend(color_rule["alerts"])

        # ---- 2. Soiling adjustment ------------------------------------------
        soil = SOILING_ADJUSTMENTS.get(ctx.soiling_level, SOILING_ADJUSTMENTS["normal"])
        if soil["temp_delta"] or soil["duration_delta"] or soil["spin_delta"]:
            temp += soil["temp_delta"]
            duration += soil["duration_delta"]
            spin += soil["spin_delta"]
            reasons.append(
                f"Soiling level '{ctx.soiling_level}': temperature "
                f"{soil['temp_delta']:+d}°C, duration {soil['duration_delta']:+d} min, "
                f"spin {soil['spin_delta']:+d} RPM."
            )
        alerts.extend(soil["alerts"])

        # ---- 3. Load-size adjustment ----------------------------------------
        load = LOAD_ADJUSTMENTS.get(ctx.load_size, LOAD_ADJUSTMENTS["medium"])
        duration += load["duration_delta"]
        spin += load["spin_delta"]
        if load["duration_delta"]:
            reasons.append(
                f"Load size '{ctx.load_size}': duration {load['duration_delta']:+d} min."
            )
        alerts.extend(load["alerts"])

        # ---- 4. Garment-lifecycle (ageing) adjustment ------------------------
        if ctx.wash_count >= 30:
            temp -= 5
            spin = min(spin, 600)
            duration += 5
            alerts.append(
                f"Garment has been washed {ctx.wash_count} times — fabric is ageing. "
                "Gentler settings applied."
            )
            reasons.append("Lifecycle rule: high wash count → reduced thermal and mechanical stress.")
        elif ctx.wash_count >= 15:
            spin = min(spin, 800)
            reasons.append("Lifecycle rule: mid-life garment → spin capped at 800 RPM.")

        if ctx.health_score < 50:
            spin = min(spin, 600)
            temp -= 5
            alerts.append(
                f"Fabric health score is low ({ctx.health_score:.0f}/100). "
                "Consider a hand-wash or delicate cycle."
            )
            reasons.append("Health-score rule: low fabric health → gentle wash regime.")
            confidence -= 0.05

        # ---- 5. Final safety clamping ----------------------------------------
        raw = (temp, spin, duration)
        temp = _clamp(temp, profile.min_temp_c, profile.max_temp_c)
        spin = _clamp(spin, 200, profile.max_spin_rpm)
        duration = _clamp(duration, 15, 120)
        if (temp, spin, duration) != raw:
            reasons.append(
                f"Settings clamped to the safe envelope for {profile.label}: "
                f"{profile.min_temp_c}–{profile.max_temp_c}°C, "
                f"max {profile.max_spin_rpm} RPM."
            )
            confidence -= 0.03

        # De-duplicate while preserving order
        alerts = list(dict.fromkeys(alerts))
        confidence = round(max(0.45, min(0.95, confidence)), 2)

        return RuleResult(
            cycle_type=cycle,
            water_temp=int(temp),
            spin_rpm=int(spin),
            duration_min=int(duration),
            detergent=profile.detergent,
            drying=profile.drying,
            ironing=profile.ironing,
            alerts=alerts,
            reasons=reasons,
            confidence=confidence,
            fabric_key=profile.key,
            bounds={
                "min_temp_c": profile.min_temp_c,
                "max_temp_c": profile.max_temp_c,
                "max_spin_rpm": profile.max_spin_rpm,
                "durability": profile.durability,
            },
        )

    @staticmethod
    def most_delicate(fabric_types: list[str]) -> str:
        if not fabric_types:
            return "cotton"
        return min(
            (f.strip().lower() for f in fabric_types if f),
            key=lambda f: get_fabric_profile(f).durability,
            default="cotton",
        )

    @staticmethod
    def catalogue() -> list[dict]:
        return [
            {
                "key": p.key,
                "label": p.label,
                "durability": p.durability,
                "base_temp_c": p.base_temp_c,
                "temp_range": [p.min_temp_c, p.max_temp_c],
                "max_spin_rpm": p.max_spin_rpm,
                "cycle_type": p.cycle_type,
                "detergent": p.detergent,
                "drying": p.drying,
                "ironing": p.ironing,
                "alerts": list(p.alerts),
            }
            for p in FABRIC_KNOWLEDGE.values()
        ]