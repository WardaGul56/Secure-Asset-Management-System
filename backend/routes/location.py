from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import LocationLog, Zone, Assignment
from ..auth_utils import get_current_user
from geoalchemy2 import WKTElement
from sqlalchemy import text

router = APIRouter()

class LocationLogCreate(BaseModel):
    asset_id: int
    current_location: str  # WKT format for POINT

class BreachAlert(BaseModel):
    log_id: int
    asset_id: int
    zone_id: int
    breach_type: str  # "entered_forbidden" or "exited_allowed"

@router.post("/log-location")
async def log_location(location_data: LocationLogCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Only operators can log locations
    if current_user.get("role") != "operator":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only operators can log locations")
    
    # Check if operator is assigned to this asset
    assignment = db.query(Assignment).filter(
        Assignment.op_id == current_user.get("op_id"),
        Assignment.asset_id == location_data.asset_id,
        Assignment.status == "active"
    ).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not assigned to this asset")
    
    # Create location log
    location_geom = WKTElement(location_data.current_location, srid=4326)
    new_log = LocationLog(
        asset_id=location_data.asset_id,
        op_id=current_user["op_id"],
        current_location=location_geom
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    # Check for breaches
    breaches = check_breaches(db, new_log)
    
    response = {"message": "Location logged successfully", "log_id": new_log.log_id}
    if breaches:
        response["breaches"] = breaches
    
    return response

def check_breaches(db: Session, log: LocationLog) -> list:
    breaches = []
    
    # Check if location is in any forbidden zone
    forbidden_zones = db.query(Zone).filter(Zone.is_forbidden == True).all()
    for zone in forbidden_zones:
        # Use PostGIS ST_Contains to check if point is within polygon
        result = db.execute(text("""
            SELECT ST_Contains(:zone_boundary, :location_point) as contains
        """), {
            "zone_boundary": zone.boundary,
            "location_point": log.current_location
        }).fetchone()
        
        if result and result.contains:
            breaches.append({
                "log_id": log.log_id,
                "asset_id": log.asset_id,
                "zone_id": zone.zone_id,
                "breach_type": "entered_forbidden"
            })
    
    # Could add more breach logic here (e.g., exiting allowed zones)
    
    return breaches

@router.get("/location-logs/{asset_id}")
async def get_location_logs(asset_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check permissions - assigned operators, managers, admins
    if current_user.get("role") == "operator":
        assignment = db.query(Assignment).filter(
            Assignment.op_id == current_user.get("op_id"),
            Assignment.asset_id == asset_id,
            Assignment.status == "active"
        ).first()
        if not assignment:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this asset's logs")
    elif current_user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    logs = db.query(LocationLog).filter(LocationLog.asset_id == asset_id).order_by(LocationLog.time_stamp.desc()).limit(100).all()
    
    return [
        {
            "log_id": log.log_id,
            "asset_id": log.asset_id,
            "op_id": log.op_id,
            "current_location": str(log.current_location),
            "time_stamp": str(log.time_stamp)
        } for log in logs
    ]