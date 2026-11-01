from fastapi import APIRouter

from app.api.v1 import (
    advisory,
    dashboard,
    feedback,
    garments,
    lifecycle,
    meta,
    profiles,
    users,
    wash_cycles,
)

api_router = APIRouter()
api_router.include_router(meta.router, prefix="/meta", tags=["meta"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(garments.router, prefix="/garments", tags=["garments"])
api_router.include_router(advisory.router, prefix="/advisory", tags=["advisory"])
api_router.include_router(wash_cycles.router, prefix="/wash-cycles", tags=["wash-cycles"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
api_router.include_router(lifecycle.router, prefix="/lifecycle", tags=["lifecycle"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])