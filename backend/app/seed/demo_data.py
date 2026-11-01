"""
Seeds a demo household with garments, wash history and feedback so the
LEARN / TRACK / OPTIMIZE stages have data on first run.
"""
import random
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.ml.adaptive import AdaptiveEngine
from app.models import Feedback, Garment, User, WashCycle, WashCycleGarment
from app.services import lifecycle_service, ml_service, profile_service

random.seed(42)

DEMO_GARMENTS = [
    ("Navy Slim Jeans", "denim", "dark", date.today() - timedelta(days=500)),
    ("White Oxford Shirt", "cotton", "white", date.today() - timedelta(days=300)),
    ("Black Cotton Tee", "dark_cotton", "dark", date.today() - timedelta(days=200)),
    ("Merino Crew Sweater", "wool", "light", date.today() - timedelta(days=420)),
    ("Silk Scarf", "silk", "bright", date.today() - timedelta(days=180)),
    ("Grey Joggers", "polyester", "light", date.today() - timedelta(days=120)),
    ("Floral Viscose Dress", "viscose", "bright", date.today() - timedelta(days=260)),
    ("Beige Linen Trousers", "linen", "light", date.today() - timedelta(days=150)),
]

FABRIC_WASH = {
    "denim": (30, 600, 40),
    "cotton": (40, 1000, 45),
    "dark_cotton": (30, 800, 40),
    "wool": (30, 400, 30),
    "silk": (30, 400, 25),
    "polyester": (40, 800, 35),
    "viscose": (30, 400, 30),
    "linen": (40, 800, 40),
}


def seed(db: Session) -> dict:
    existing = db.query(User).filter(User.email == "user@havels.com").first()
    if existing:
        return {"created": False, "user_id": existing.id, "message": "Demo data already present"}

    user = User(
        name="Household User",
        email="user@havels.com",
        household_id="HH-user-01",
        age_group="35-44",
        region="EU",
        preferences={"language": "en", "units": "metric"},
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    garments: list[Garment] = []
    for name, fabric, color, purchased in DEMO_GARMENTS:
        garment = Garment(
            user_id=user.id,
            name=name,
            fabric_type=fabric,
            color_group=color,
            brand="DemoBrand",
            purchase_date=purchased,
        )
        db.add(garment)
        db.flush()
        garment.health_score = lifecycle_service.compute_health_score(
            fabric_type=fabric,
            wear_count=0,
            wash_count=0,
            age_days=(date.today() - purchased).days,
            avg_defect=0.0,
        )
        db.add(garment)
        garments.append(garment)
    db.commit()

    # ---- synthetic wear/wash history + feedback ---------------------------
    for _ in range(18):
        garment = random.choice(garments)
        temp, spin, duration = FABRIC_WASH.get(garment.fabric_type, (30, 800, 35))
        cycle = WashCycle(
            user_id=user.id,
            cycle_type="Demo cycle",
            water_temp=temp + random.choice([-5, 0, 5]),
            spin_rpm=max(400, spin + random.choice([-200, 0, 200])),
            duration_min=duration + random.choice([-5, 0, 5]),
            detergent_type="Liquid",
            load_size=random.choice(["small", "medium", "large"]),
            soiling_level=random.choice(["light", "normal", "heavy"]),
            engine_used="rule",
            created_at=__import__("datetime").datetime.utcnow()
            - timedelta(days=random.randint(1, 120)),
        )
        db.add(cycle)
        db.flush()

        wear_before = garment.wear_count
        garment.wear_count += random.randint(1, 3)
        garment.wash_count += 1
        garment.last_wash_at = cycle.created_at

        db.add(
            WashCycleGarment(
                wash_cycle_id=cycle.id,
                garment_id=garment.id,
                wear_count_at_wash=wear_before,
            )
        )
        db.add(garment)

        # Gentle fabrics → more damage feedback
        harshness = 1.0 if garment.fabric_type in ("wool", "silk", "viscose") else 0.4
        if cycle.water_temp >= 40:
            harshness += 0.4
        if cycle.spin_rpm >= 800:
            harshness += 0.3

        db.add(
            Feedback(
                user_id=user.id,
                wash_cycle_id=cycle.id,
                garment_id=garment.id,
                cleaning_satisfaction=random.choice([3, 4, 5, 5]),
                fading=min(3, int(random.random() * 3 * harshness)),
                shrinkage=min(3, int(random.random() * 2.5 * harshness)),
                roughness=min(3, int(random.random() * 2 * harshness)),
                pilling=min(3, int(random.random() * 2 * harshness)),
                color_loss=min(3, int(random.random() * 3 * harshness)),
                notes="Seeded demo feedback",
            )
        )

    db.commit()

    # Recompute health now that wear/wash/feedback exist
    for garment in garments:
        lifecycle_service.recompute_garment_health(db, garment)

    # Build profile + train adaptive model
    profile_service.rebuild_profile(db, user.id)
    train_result = ml_service.train_user_model(db, user.id)

    return {
        "created": True,
        "user_id": user.id,
        "garments": len(garments),
        "adaptive_training": train_result,
    }