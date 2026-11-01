from app.ml.health_score import compute_health_score, health_band


def test_new_garment_is_healthy():
    score = compute_health_score("cotton", wear_count=0, wash_count=0, age_days=0, avg_defect=0)
    assert score > 95
    assert health_band(score) == "Excellent"


def test_delicate_fabric_decays_faster_than_durable_fabric():
    wool = compute_health_score("wool", wear_count=20, wash_count=20, age_days=365, avg_defect=0.5)
    polyester = compute_health_score(
        "polyester", wear_count=20, wash_count=20, age_days=365, avg_defect=0.5
    )
    assert wool < polyester


def test_score_is_bounded():
    score = compute_health_score("silk", wear_count=500, wash_count=500, age_days=5000, avg_defect=3)
    assert 0.0 <= score <= 100.0