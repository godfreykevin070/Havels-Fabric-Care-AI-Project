"""
Customer washing-behaviour profiling — Milestone 2 (LEARN).

Builds aggregate behaviour metrics per user and assigns a care group.
Uses KMeans when a sufficient number of user profiles exist, and a
documented heuristic fallback otherwise (cold-start safe).
"""
import numpy as np
from sklearn.cluster import KMeans

from app.rule_engine.knowledge_base import get_fabric_profile

CARE_GROUPS = ["Gentle Care", "Balanced Care", "Performance Care"]
MIN_USERS_FOR_CLUSTERING = 8

PROFILE_FEATURE_KEYS = [
    "gentle_index",
    "avg_temp_norm",
    "avg_spin_norm",
    "avg_defect_norm",
    "delicate_share",
]


def _norm(value: float, low: float, high: float) -> float:
    if high <= low:
        return 0.0
    return max(0.0, min(1.0, (value - low) / (high - low)))


def compute_metrics(cycles: list, feedbacks: list, garments: list) -> dict:
    """Aggregate raw history into behaviour metrics (all normalised 0–1 where noted)."""
    n_cycles = len(cycles)
    n_feedback = len(feedbacks)

    avg_temp = float(np.mean([c.water_temp for c in cycles])) if cycles else 40.0
    avg_spin = float(np.mean([c.spin_rpm for c in cycles])) if cycles else 800.0
    avg_duration = float(np.mean([c.duration_min for c in cycles])) if cycles else 40.0

    avg_satisfaction = (
        float(np.mean([f.cleaning_satisfaction for f in feedbacks])) if feedbacks else 0.0
    )
    defect_per_feedback = [
        (f.fading + f.shrinkage + f.roughness + f.pilling + f.color_loss) / 5.0
        for f in feedbacks
    ]
    avg_defect = float(np.mean(defect_per_feedback)) if defect_per_feedback else 0.0

    delicate_washes = 0
    for c in cycles:
        fabrics = [link.garment.fabric_type for link in c.garment_links if link.garment]
        if any(get_fabric_profile(f).durability <= 0.5 for f in fabrics):
            delicate_washes += 1
    delicate_share = delicate_washes / n_cycles if n_cycles else 0.0

    dark_washes = 0
    for c in cycles:
        colors = [link.garment.color_group for link in c.garment_links if link.garment]
        if colors and all(col in ("dark", "bright") for col in colors):
            dark_washes += 1
    dark_share = dark_washes / n_cycles if n_cycles else 0.0

    avg_temp_norm = _norm(avg_temp, 20, 60)
    avg_spin_norm = _norm(avg_spin, 400, 1200)
    avg_defect_norm = _norm(avg_defect, 0, 3)
    satisfaction_norm = _norm(avg_satisfaction, 1, 5) if n_feedback else 0.5

    gentle_index = round(
        0.35 * avg_defect_norm
        + 0.25 * delicate_share
        + 0.20 * (1 - avg_temp_norm)
        + 0.20 * (1 - avg_spin_norm),
        4,
    )

    return {
        "total_washes": n_cycles,
        "total_feedbacks": n_feedback,
        "avg_temp": round(avg_temp, 1),
        "avg_spin": round(avg_spin, 0),
        "avg_duration": round(avg_duration, 1),
        "avg_cleaning_satisfaction": round(avg_satisfaction, 2),
        "avg_defect": round(avg_defect, 3),
        "delicate_share": round(delicate_share, 3),
        "dark_share": round(dark_share, 3),
        "avg_temp_norm": round(avg_temp_norm, 3),
        "avg_spin_norm": round(avg_spin_norm, 3),
        "avg_defect_norm": round(avg_defect_norm, 3),
        "satisfaction_norm": round(satisfaction_norm, 3),
        "gentle_index": gentle_index,
        "garment_count": len(garments),
        "avg_garment_health": round(
            float(np.mean([g.health_score for g in garments])), 1
        ) if garments else 100.0,
    }


def heuristic_care_group(metrics: dict) -> str:
    """Cold-start classifier driven by documented thresholds."""
    gentle = metrics.get("gentle_index", 0.5)
    defect = metrics.get("avg_defect_norm", 0.0)
    delicate = metrics.get("delicate_share", 0.0)
    spin = metrics.get("avg_spin_norm", 0.5)

    if gentle >= 0.55 or defect >= 0.5 or delicate >= 0.4:
        return "Gentle Care"
    if gentle <= 0.30 and defect <= 0.2 and spin >= 0.55:
        return "Performance Care"
    return "Balanced Care"


def feature_matrix(metrics_list: list[dict]) -> np.ndarray:
    return np.array(
        [[m.get(k, 0.0) for k in PROFILE_FEATURE_KEYS] for m in metrics_list],
        dtype=float,
    )


def cluster_care_groups(metrics_list: list[dict]) -> list[str]:
    """
    KMeans (k=3) over user behaviour metrics. Falls back to heuristics when
    there are too few users. Cluster labels are ordered by centroid
    'gentle_index' (descending) so labels stay semantically stable.
    """
    if len(metrics_list) < MIN_USERS_FOR_CLUSTERING:
        return [heuristic_care_group(m) for m in metrics_list]

    X = feature_matrix(metrics_list)
    k = 3
    km = KMeans(n_clusters=k, n_init=10, random_state=42)
    labels = km.fit_predict(X)

    order = np.argsort(-km.cluster_centers_[:, 0])  # by gentle_index desc
    mapping = {int(cluster_id): CARE_GROUPS[rank] for rank, cluster_id in enumerate(order)}
    return [mapping[int(lbl)] for lbl in labels]


def preferred_settings(metrics: dict, care_group: str) -> dict:
    """Translate behaviour metrics + care group into a preferred operating point."""
    base_temp = int(round(metrics.get("avg_temp", 40)))
    base_spin = int(round(metrics.get("avg_spin", 800)))
    base_duration = int(round(metrics.get("avg_duration", 40)))

    if care_group == "Gentle Care":
        base_temp = min(base_temp, 30)
        base_spin = min(base_spin, 600)
    elif care_group == "Performance Care":
        base_spin = max(base_spin, 900)

    return {
        "preferred_temp": max(20, min(60, base_temp)),
        "preferred_spin": max(400, min(1200, base_spin)),
        "preferred_duration": max(15, min(90, base_duration)),
    }