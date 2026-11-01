from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Garment
from app.schemas.garment import (
    GarmentCreate,
    GarmentHealthOut,
    GarmentOut,
    GarmentUpdate,
)
from app.services import lifecycle_service

router = APIRouter()


@router.post("", response_model=GarmentOut, status_code=201)
def create_garment(payload: GarmentCreate, db: Session = Depends(get_db)):
    return lifecycle_service.create_garment(db, payload)


@router.get("", response_model=list[GarmentOut])
def list_garments(user_id: int = Query(...), db: Session = Depends(get_db)):
    lifecycle_service.get_user_or_404(db, user_id)
    return (
        db.query(Garment)
        .filter(Garment.user_id == user_id)
        .order_by(Garment.health_score.asc())
        .all()
    )


@router.get("/{garment_id}", response_model=GarmentOut)
def get_garment(garment_id: int, db: Session = Depends(get_db)):
    return lifecycle_service.get_garment_or_404(db, garment_id)


@router.patch("/{garment_id}", response_model=GarmentOut)
def update_garment(garment_id: int, payload: GarmentUpdate, db: Session = Depends(get_db)):
    garment = lifecycle_service.get_garment_or_404(db, garment_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(garment, key, value)
    db.add(garment)
    db.commit()
    db.refresh(garment)
    return garment


@router.post("/{garment_id}/wear", response_model=GarmentOut)
def log_wear(garment_id: int, db: Session = Depends(get_db)):
    return lifecycle_service.log_wear(db, garment_id)


@router.get("/{garment_id}/health", response_model=GarmentHealthOut)
def garment_health(garment_id: int, db: Session = Depends(get_db)):
    return lifecycle_service.health_detail(db, garment_id)


@router.delete("/{garment_id}", status_code=204)
def delete_garment(garment_id: int, db: Session = Depends(get_db)):
    garment = lifecycle_service.get_garment_or_404(db, garment_id)
    db.delete(garment)
    db.commit()
    return None