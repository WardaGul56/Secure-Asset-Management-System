from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import BreachLog, Zone, Asset
from ..auth_utils import get_current_user
from typing import List
from datetime import datetime, timedelta

router = APIRouter()

class BreachResponse(BaseModel):
    breach_id: int
    log_id: int
    asset_id: int
    zone_id: int
    breach_type: str
    detected_at: str
    asset_name: str
    zone_name: str

@router.get("/breaches", response_model=List[BreachResponse])
async def get_breaches(
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db),
    days: int = 7  # Last N days
):
    # Only admins can view breaches
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can view breach logs")
    
    since_date = datetime.utcnow() - timedelta(days=days)
    
    breaches = db.query(BreachLog).filter(BreachLog.detected_at >= since_date).all()
    
    result = []
    for breach in breaches:
        asset = db.query(Asset).filter(Asset.asset_id == breach.asset_id).first()
        zone = db.query(Zone).filter(Zone.zone_id == breach.zone_id).first()
        
        result.append(BreachResponse(
            breach_id=breach.breach_id,
            log_id=breach.log_id,
            asset_id=breach.asset_id,
            zone_id=breach.zone_id,
            breach_type=breach.breach_type,
            detected_at=str(breach.detected_at),
            asset_name=asset.asset_name if asset else "Unknown",
            zone_name=zone.zone_name if zone else "Unknown"
        ))
    
    return result

@router.get("/breach/{breach_id}")
async def get_breach_details(breach_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can view breach details")
    
    breach = db.query(BreachLog).filter(BreachLog.breach_id == breach_id).first()
    if not breach:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Breach not found")
    
    # Get related data
    asset = db.query(Asset).filter(Asset.asset_id == breach.asset_id).first()
    zone = db.query(Zone).filter(Zone.zone_id == breach.zone_id).first()
    
    return {
        "breach_id": breach.breach_id,
        "log_id": breach.log_id,
        "asset": {
            "asset_id": asset.asset_id if asset else None,
            "asset_name": asset.asset_name if asset else "Unknown",
            "plate_number": asset.plate_number if asset else "Unknown"
        },
        "zone": {
            "zone_id": zone.zone_id if zone else None,
            "zone_name": zone.zone_name if zone else "Unknown",
            "is_forbidden": zone.is_forbidden if zone else None
        },
        "breach_type": breach.breach_type,
        "detected_at": str(breach.detected_at),
        "details": breach.details
    }

@router.delete("/breach/{breach_id}")
async def delete_breach(breach_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can delete breaches")
    
    breach = db.query(BreachLog).filter(BreachLog.breach_id == breach_id).first()
    if not breach:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Breach not found")
    
    db.delete(breach)
    db.commit()
    
    return {"message": "Breach record deleted successfully"}