def _create_user(client):
    resp = client.post(
        "/api/v1/users",
        json={"name": "Test User", "email": "test@example.com"},
    )
    assert resp.status_code in (201, 409)
    if resp.status_code == 409:
        users = client.get("/api/v1/users").json()
        return next(u for u in users if u["email"] == "test@example.com")["id"]
    return resp.json()["id"]


def test_advisory_endpoint_returns_rule_recommendation(client):
    user_id = _create_user(client)
    garment = client.post(
        "/api/v1/garments",
        json={
            "user_id": user_id,
            "name": "Test Wool Sweater",
            "fabric_type": "wool",
            "color_group": "dark",
        },
    ).json()

    resp = client.post(
        "/api/v1/advisory/recommend",
        json={
            "user_id": user_id,
            "garment_ids": [garment["id"]],
            "soiling_level": "normal",
            "load_size": "medium",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["water_temp"] <= 30
    assert body["engine"] in ("rule", "adaptive")
    assert len(body["reasons"]) > 0
    assert body["per_garment"][0]["garment_id"] == garment["id"]


def test_meta_endpoints(client):
    assert client.get("/api/v1/meta/fabrics").status_code == 200
    assert client.get("/api/v1/meta/enums").status_code == 200