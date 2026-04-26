from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import Zone, SecurityAdmin
from ..auth_utils import get_current_user
from typing import List

router = APIRouter()

class ZoneCreate(BaseModel):
    zone_name: str
    boundary: str  # WKT format for polygon
    is_forbidden: bool = False

class ZoneResponse(BaseModel):
    zone_id: int
    zone_name: str
    boundary: str
    is_forbidden: bool
    created_by: str

@router.post("/create-zone")
async def create_zone(zone_data: ZoneCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if current user is admin
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can create zones")
    
    # Get admin_id
    admin = db.query(SecurityAdmin).filter(SecurityAdmin.user_id == current_user["user_id"]).first()
    if not admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin not found")
    
    # Create zone
    from geoalchemy2 import WKTElement
    boundary_geom = WKTElement(zone_data.boundary, srid=4326)
    
    new_zone = Zone(
        zone_name=zone_data.zone_name,
        boundary=boundary_geom,
        is_forbidden=zone_data.is_forbidden,
        created_by=admin.admin_id
    )
    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)
    
    return {"message": "Zone created successfully", "zone_id": new_zone.zone_id}

@router.get("/zones", response_model=List[ZoneResponse])
async def get_zones(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    zones = db.query(Zone).all()
    return [
        ZoneResponse(
            zone_id=zone.zone_id,
            zone_name=zone.zone_name,
            boundary=str(zone.boundary),
            is_forbidden=zone.is_forbidden,
            created_by=zone.created_by
        ) for zone in zones
    ]