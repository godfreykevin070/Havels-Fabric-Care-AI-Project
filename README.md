# Fabric Care AI — POC

AI/ML-based Fabric Care advisory system covering **Fabric Care Intelligence** and
**Garment Life Management**: pre-wash recommendations, post-wash feedback learning,
adaptive recommendation optimisation and garment lifecycle tracking.

## Milestone mapping

| Milestone | Stage | Implementation |
|---|---|---|
| 1 — INFORM | Rule-based Fabric Care Advisor | `backend/app/rule_engine/` |
| 2 — LEARN | User profile + adaptive engine | `backend/app/ml/profiling.py`, `backend/app/services/profile_service.py` |
| 3 — TRACK | Digital wardrobe + Fabric Health Score | `backend/app/ml/health_score.py`, `backend/app/services/lifecycle_service.py` |
| 4 — OPTIMIZE | Closed protection loop | `backend/app/ml/adaptive.py`, `backend/app/services/advisory_service.py` |

## Architecture

```
USER → React + TypeScript → FastAPI Backend
                              ├── Rule Engine      (rule_engine/)
                              ├── ML Engine        (ml/: profiling, adaptive, health)
                              └── Lifecycle        (services/lifecycle_service.py)
                                        ↓
                                   PostgreSQL
                                        ↓
                          Recommendation / Dashboard (Recharts)
```

## Running locally (Docker)

```bash
docker compose up --build
# Backend  → http://localhost:8000/docs
# Frontend → http://localhost:5173
```

Seed demo data (8 garments, 18 wash cycles, feedback, profile, trained model):

```bash
docker compose exec backend python -m app.seed
```

## Running locally (native)

```bash
# --- backend ---
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # point DATABASE_URL at your Postgres
uvicorn app.main:app --reload

# --- seed demo data ---
python -m app.seed

# --- frontend ---
cd ../frontend
npm install
npm run dev
```

For a quick no-Postgres run, set `DATABASE_URL=sqlite:///./fabriccare.db`.

## Tests

```bash
cd backend && pytest
```

## Key API endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/api/v1/meta/fabrics` | Fabric knowledge base |
| `POST` | `/api/v1/garments` | Register a garment |
| `POST` | `/api/v1/garments/{id}/wear` | Log a wear (lifecycle) |
| `POST` | `/api/v1/advisory/recommend` | **Core** pre-wash recommendation |
| `POST` | `/api/v1/wash-cycles` | Log an executed wash |
| `POST` | `/api/v1/feedback` | Post-wash feedback |
| `GET`  | `/api/v1/profiles/{user_id}` | Behaviour profile |
| `POST` | `/api/v1/profiles/{user_id}/rebuild` | Recompute profile + care group |
| `POST` | `/api/v1/profiles/{user_id}/train` | Retrain adaptive model |
| `GET`  | `/api/v1/lifecycle/wardrobe/{user_id}` | Wardrobe + health scores |
| `GET`  | `/api/v1/dashboard/{user_id}` | Consolidated dashboard payload |

## Cold-start behaviour

* **< 12 feedback records** → advisory uses the rule engine only; the response is
  flagged `engine: "rule"` with confidence ≤ 0.88.
* **≥ 12 feedback records** → the Ridge-based adaptive model is trained; the
  optimiser grid-searches settings near the rule baseline and the response is
  flagged `engine: "adaptive"` with the applied deltas in `reasons`.
* **< 8 users** → care-group assignment falls back to the documented heuristic
  classifier; at ≥ 8 users, KMeans (k=3) is used instead
  (`model_version: "v2-kmeans"`).

## Out of scope (per proposal)

Fabric-detection hardware, sensor/PCB integration, commercial mobile app,
full production deployment, large-scale dataset creation, competitor benchmarking.