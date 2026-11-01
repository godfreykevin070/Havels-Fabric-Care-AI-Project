import logging
import os
from datetime import datetime

import joblib
import numpy as np
from sklearn.linear_model import Ridge

from app.core.config import get_settings
from app.ml.features import FEATURE_NAMES, build_feature_vector

logger = logging.getLogger(__name__)

TARGET_KEYS = ["fading", "shrinkage", "roughness", "pilling", "color_loss", "clean_deficit"]


class AdaptiveEngine:
    def __init__(self, model_dir: str | None = None) -> None:
        self.settings = get_settings()
        self.model_dir = model_dir or self.settings.MODEL_DIR
        os.makedirs(self.model_dir, exist_ok=True)

    def _path(self, user_id: int) -> str:
        return os.path.join(self.model_dir, f"adaptive_user_{user_id}.joblib")

    def is_trained(self, user_id: int) -> bool:
        return os.path.exists(self._path(user_id))

    def _load(self, user_id: int) -> dict | None:
        path = self._path(user_id)
        if not os.path.exists(path):
            return None
        try:
            return joblib.load(path)
        except Exception:
            logger.exception("Failed to load adaptive model for user %s", user_id)
            return None

    def train(self, user_id: int, samples: list[dict]) -> dict:
        n = len(samples)
        if n < self.settings.MIN_TRAINING_SAMPLES:
            return {
                "trained": False,
                "n_samples": n,
                "reason": (
                    f"insufficient_feedback (need {self.settings.MIN_TRAINING_SAMPLES}, have {n})"
                ),
            }

        X = np.array([build_feature_vector(s) for s in samples], dtype=float)
        y = np.array(
            [
                [
                    s["fading"],
                    s["shrinkage"],
                    s["roughness"],
                    s["pilling"],
                    s["color_loss"],
                    5 - s["cleaning_satisfaction"],
                ]
                for s in samples
            ],
            dtype=float,
        )

        model = Ridge(alpha=1.0)
        model.fit(X, y)

        bundle = {
            "model": model,
            "n_samples": n,
            "trained_at": datetime.utcnow().isoformat(),
            "feature_names": FEATURE_NAMES,
            "targets": TARGET_KEYS,
        }
        joblib.dump(bundle, self._path(user_id))
        logger.info("Adaptive model trained for user %s on %s samples", user_id, n)

        return {"trained": True, "n_samples": n, "trained_at": bundle["trained_at"]}

    def optimize(self, user_id: int, base: dict, context: dict) -> dict | None:
        bundle = self._load(user_id)
        if bundle is None:
            return None

        model: Ridge = bundle["model"]
        fabric = context["fabric_type"]
        color = context.get("color_group", "light")
        wash_count = int(context.get("wash_count", 0))
        soiling = context.get("soiling_level", "normal")

        lo_t, hi_t = int(context["min_temp_c"]), int(context["max_temp_c"])
        hi_spin = int(context["max_spin_rpm"])
        base_t, base_s, base_d = base["water_temp"], base["spin_rpm"], base["duration_min"]

        # Generate candidates strictly within the safe envelope provided
        temps = sorted({max(lo_t, min(hi_t, base_t + d)) for d in (-10, -5, 0, 5, 10)})
        spins = sorted({max(200, min(hi_spin, base_s + d)) for d in (-400, -200, 0, 200, 400)})
        durs = sorted({max(15, min(120, base_d + d)) for d in (-10, -5, 0, 5, 10)})

        rows, cands = [], []
        for t in temps:
            for s in spins:
                for d in durs:
                    cands.append((t, s, d))
                    rows.append(
                        build_feature_vector(
                            {
                                "fabric_type": fabric,
                                "color_group": color,
                                "water_temp": t,
                                "spin_rpm": s,
                                "duration_min": d,
                                "wash_count": wash_count,
                                "soiling_level": soiling,
                            }
                        )
                    )

        preds = model.predict(np.array(rows, dtype=float))

        best = None
        for (t, s, d), p in zip(cands, preds):
            damage = float(np.sum(p[:5]))
            clean_deficit = float(p[5])
            deviation = (
                0.15 * abs(t - base_t) / 10.0
                + 0.10 * abs(s - base_s) / 200.0
                + 0.10 * abs(d - base_d) / 10.0
            )
            # Penalize damage and heavily penalize cleaning shortfall
            score = -(damage + 1.2 * clean_deficit) - deviation
            
            if best is None or score > best["score"]:
                best = {
                    "score": score,
                    "water_temp": int(t),
                    "spin_rpm": int(s),
                    "duration_min": int(d),
                    "predicted_damage": damage,
                    "predicted_clean_deficit": clean_deficit,
                }

        if best is None:
            return None

        best["n_samples"] = bundle["n_samples"]
        best["trained_at"] = bundle["trained_at"]
        best["delta_temp"] = best["water_temp"] - base_t
        best["delta_spin"] = best["spin_rpm"] - base_s
        best["delta_duration"] = best["duration_min"] - base_d
        best["changed"] = any(
            (best["delta_temp"], best["delta_spin"], best["delta_duration"])
        )
        return best