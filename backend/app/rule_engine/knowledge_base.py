"""
Rule-based advisory knowledge base (Milestone 1 — INFORM).

Consolidates industry practice and public care-label guidance into a
machine-readable fabric care knowledge base.
"""
from dataclasses import dataclass, field


@dataclass(frozen=True)
class FabricProfile:
    key: str
    label: str
    durability: float          # 0 (fragile) .. 1 (very durable) — drives health decay
    base_temp_c: int
    min_temp_c: int
    max_temp_c: int
    base_spin_rpm: int
    max_spin_rpm: int
    base_duration_min: int
    cycle_type: str
    detergent: str
    drying: str
    ironing: str
    alerts: tuple[str, ...] = field(default_factory=tuple)


FABRIC_KNOWLEDGE: dict[str, FabricProfile] = {
    "cotton": FabricProfile(
        key="cotton", label="Cotton", durability=0.85,
        base_temp_c=40, min_temp_c=20, max_temp_c=60,
        base_spin_rpm=1000, max_spin_rpm=1200, base_duration_min=45,
        cycle_type="Cottons / Normal",
        detergent="Standard powder or liquid detergent",
        drying="Tumble dry medium or line dry",
        ironing="High heat (~200°C), slightly damp",
        alerts=("Wash with similar colours to avoid cross-staining",),
    ),
    "dark_cotton": FabricProfile(
        key="dark_cotton", label="Dark / Dyed Cotton", durability=0.80,
        base_temp_c=30, min_temp_c=20, max_temp_c=40,
        base_spin_rpm=800, max_spin_rpm=800, base_duration_min=40,
        cycle_type="Cottons — Dark / Gentle",
        detergent="Colour-care liquid detergent (no optical brighteners)",
        drying="Line dry in shade, inside out",
        ironing="Medium (~150°C), inside out",
        alerts=(
            "Wash inside out to reduce surface fading",
            "Cold or 30°C wash preserves dye depth",
            "Avoid direct sunlight when drying",
        ),
    ),
    "denim": FabricProfile(
        key="denim", label="Denim", durability=0.90,
        base_temp_c=30, min_temp_c=20, max_temp_c=40,
        base_spin_rpm=600, max_spin_rpm=800, base_duration_min=40,
        cycle_type="Denim / Gentle",
        detergent="Colour-care liquid detergent",
        drying="Line dry in shade, inside out",
        ironing="Medium (~150°C), inside out",
        alerts=(
            "Wash inside out and sparingly to preserve indigo",
            "Do not use fabric softener on denim",
        ),
    ),
    "linen": FabricProfile(
        key="linen", label="Linen", durability=0.70,
        base_temp_c=40, min_temp_c=30, max_temp_c=60,
        base_spin_rpm=800, max_spin_rpm=1000, base_duration_min=40,
        cycle_type="Cottons — Gentle",
        detergent="Mild liquid detergent",
        drying="Line dry; remove while slightly damp",
        ironing="High with steam (~200°C)",
        alerts=("Wrinkles naturally — avoid over-drying",),
    ),
    "wool": FabricProfile(
        key="wool", label="Wool", durability=0.45,
        base_temp_c=30, min_temp_c=20, max_temp_c=30,
        base_spin_rpm=400, max_spin_rpm=600, base_duration_min=30,
        cycle_type="Wool / Hand-wash",
        detergent="Wool-safe pH-neutral liquid detergent",
        drying="Flat dry in shade, reshape while damp",
        ironing="Low with pressing cloth",
        alerts=(
            "Never tumble dry — shrinkage risk is high",
            "Do not wring or twist",
            "Use wool cycle only; avoid agitation",
        ),
    ),
    "silk": FabricProfile(
        key="silk", label="Silk", durability=0.35,
        base_temp_c=30, min_temp_c=20, max_temp_c=30,
        base_spin_rpm=400, max_spin_rpm=400, base_duration_min=25,
        cycle_type="Delicates / Hand-wash",
        detergent="Silk-safe pH-neutral liquid detergent",
        drying="Flat dry in shade",
        ironing="Low, inside out with cloth",
        alerts=(
            "Do not bleach",
            "Do not tumble dry",
            "Avoid direct sunlight — colour fades quickly",
        ),
    ),
    "polyester": FabricProfile(
        key="polyester", label="Polyester", durability=0.90,
        base_temp_c=40, min_temp_c=30, max_temp_c=60,
        base_spin_rpm=800, max_spin_rpm=1000, base_duration_min=35,
        cycle_type="Synthetics",
        detergent="Standard liquid detergent",
        drying="Tumble dry low or line dry",
        ironing="Medium (~150°C)",
        alerts=("High heat can glaze or melt the fibre",),
    ),
    "nylon": FabricProfile(
        key="nylon", label="Nylon", durability=0.85,
        base_temp_c=40, min_temp_c=30, max_temp_c=40,
        base_spin_rpm=600, max_spin_rpm=800, base_duration_min=30,
        cycle_type="Synthetics — Gentle",
        detergent="Mild liquid detergent",
        drying="Line dry",
        ironing="Low (~110°C)",
        alerts=("Avoid high heat — fibre can distort",),
    ),
    "viscose": FabricProfile(
        key="viscose", label="Viscose / Rayon", durability=0.40,
        base_temp_c=30, min_temp_c=20, max_temp_c=40,
        base_spin_rpm=400, max_spin_rpm=600, base_duration_min=30,
        cycle_type="Delicates",
        detergent="Mild liquid detergent",
        drying="Flat / line dry in shade",
        ironing="Low with cloth",
        alerts=(
            "Fibre weakens significantly when wet — do not wring",
            "Shrinkage risk under heat",
        ),
    ),
    "acrylic": FabricProfile(
        key="acrylic", label="Acrylic", durability=0.55,
        base_temp_c=30, min_temp_c=20, max_temp_c=40,
        base_spin_rpm=600, max_spin_rpm=800, base_duration_min=30,
        cycle_type="Synthetics — Gentle",
        detergent="Mild liquid detergent",
        drying="Flat dry",
        ironing="Low (~110°C)",
        alerts=("Prone to pilling — avoid overloading",),
    ),
    "spandex_blend": FabricProfile(
        key="spandex_blend", label="Elastane / Spandex Blend", durability=0.50,
        base_temp_c=30, min_temp_c=20, max_temp_c=40,
        base_spin_rpm=600, max_spin_rpm=800, base_duration_min=30,
        cycle_type="Delicates",
        detergent="Mild liquid detergent",
        drying="Line dry in shade",
        ironing="Low (~110°C)",
        alerts=(
            "Heat degrades elastane and reduces stretch recovery",
            "Avoid tumble drying",
        ),
    ),
    "delicate_blend": FabricProfile(
        key="delicate_blend", label="Delicate Blend", durability=0.40,
        base_temp_c=30, min_temp_c=20, max_temp_c=30,
        base_spin_rpm=400, max_spin_rpm=600, base_duration_min=25,
        cycle_type="Delicates / Hand-wash",
        detergent="Mild pH-neutral liquid detergent",
        drying="Flat dry in shade",
        ironing="Low with cloth",
        alerts=("Use a mesh laundry bag to prevent snagging",),
    ),
}

# --------------------------------------------------------------------------
# Colour-group adjustments
# --------------------------------------------------------------------------
COLOR_ADJUSTMENTS: dict[str, dict] = {
    "white": {"temp_delta": 0, "spin_cap": None,
              "alerts": ["Oxygen-based bleach is acceptable for whites if the care label allows"]},
    "light": {"temp_delta": 0, "spin_cap": None, "alerts": []},
    "bright": {"temp_delta": -5, "spin_cap": 800,
               "alerts": ["Wash inside out to protect bright dyes",
                          "Use colour-care detergent"]},
    "dark": {"temp_delta": -10, "spin_cap": 800,
             "alerts": ["Wash inside out", "Cold wash preserves dye depth",
                        "Dry in shade, away from direct sun"]},
}

# --------------------------------------------------------------------------
# Soiling adjustments
# --------------------------------------------------------------------------
SOILING_ADJUSTMENTS: dict[str, dict] = {
    "light": {"temp_delta": -5, "duration_delta": -5, "spin_delta": 0, "alerts": []},
    "normal": {"temp_delta": 0, "duration_delta": 0, "spin_delta": 0, "alerts": []},
    "heavy": {"temp_delta": 10, "duration_delta": 15, "spin_delta": 200, "alerts": []},
    "stain": {"temp_delta": 0, "duration_delta": 20, "spin_delta": 0,
              "alerts": ["Pre-treat stains before washing",
                         "Avoid hot water on protein-based stains (blood, egg, dairy)"]},
}

# --------------------------------------------------------------------------
# Load-size adjustments
# --------------------------------------------------------------------------
LOAD_ADJUSTMENTS: dict[str, dict] = {
    "small": {"duration_delta": -5, "spin_delta": 0,
              "alerts": ["Small loads: reduce detergent dose by ~30%"]},
    "medium": {"duration_delta": 0, "spin_delta": 0, "alerts": []},
    "large": {"duration_delta": 10, "spin_delta": 0,
              "alerts": ["Do not exceed 80% drum fill — overloading increases creasing"]},
}

SOILING_LEVELS = list(SOILING_ADJUSTMENTS.keys())
COLOR_GROUPS = list(COLOR_ADJUSTMENTS.keys())
LOAD_SIZES = list(LOAD_ADJUSTMENTS.keys())


def get_fabric_profile(fabric_type: str) -> FabricProfile:
    """Look up a fabric profile, falling back to a conservative default."""
    return FABRIC_KNOWLEDGE.get(
        (fabric_type or "").strip().lower(),
        FABRIC_KNOWLEDGE["delicate_blend"],
    )