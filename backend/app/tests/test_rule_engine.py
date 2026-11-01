from app.rule_engine.engine import RuleContext, RuleEngine


def test_wool_recommendation_is_gentle():
    result = RuleEngine().recommend(RuleContext(fabric_type="wool", color_group="light"))
    assert result.water_temp <= 30
    assert result.spin_rpm <= 600
    assert any("tumble" in a.lower() for a in result.alerts)


def test_heavy_soiling_increases_duration():
    engine = RuleEngine()
    normal = engine.recommend(RuleContext(fabric_type="cotton", soiling_level="normal"))
    heavy = engine.recommend(RuleContext(fabric_type="cotton", soiling_level="heavy"))
    assert heavy.duration_min >= normal.duration_min
    assert heavy.water_temp >= normal.water_temp


def test_dark_colour_lowers_temperature():
    engine = RuleEngine()
    light = engine.recommend(RuleContext(fabric_type="cotton", color_group="white"))
    dark = engine.recommend(RuleContext(fabric_type="cotton", color_group="dark"))
    assert dark.water_temp < light.water_temp


def test_ageing_garment_gets_gentler_spin():
    engine = RuleEngine()
    fresh = engine.recommend(RuleContext(fabric_type="cotton", wash_count=2))
    old = engine.recommend(RuleContext(fabric_type="cotton", wash_count=45))
    assert old.spin_rpm <= fresh.spin_rpm


def test_settings_stay_inside_fabric_envelope():
    result = RuleEngine().recommend(
        RuleContext(fabric_type="silk", color_group="dark", soiling_level="heavy")
    )
    assert result.bounds["min_temp_c"] <= result.water_temp <= result.bounds["max_temp_c"]
    assert result.spin_rpm <= result.bounds["max_spin_rpm"]


def test_most_delicate_selection():
    assert RuleEngine.most_delicate(["cotton", "wool", "polyester"]) == "wool"