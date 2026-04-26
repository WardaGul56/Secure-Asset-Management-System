from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import Asset
from ..auth_utils import get_current_user
from typing import List

router = APIRouter()

class AssetCreate(BaseModel):
    asset_name: str
    plate_number: str

class AssetResponse(BaseModel):
    asset_id: int
    asset_name: str
    plate_number: str
    scheduled_status: str

@router.post("/create-asset")
async def create_asset(asset_data: AssetCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check permissions - managers and admins can create assets
    if current_user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    # Check if plate number already exists
    existing_asset = db.query(Asset).filter(Asset.plate_number == asset_data.plate_number).first()
    if existing_asset:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plate number already exists")
    
    new_asset = Asset(
        asset_name=asset_data.asset_name,
        plate_number=asset_data.plate_number
    )
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    
    return {"message": "Asset created successfully", "asset_id": new_asset.asset_id}

@router.get("/assets", response_model=List[AssetResponse])
async def get_assets(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    assets = db.query(Asset).all()
    return [
        AssetResponse(
            asset_id=asset.asset_id,
            asset_name=asset.asset_name,
            plate_number=asset.plate_number,
            scheduled_status=asset.scheduled_status
        ) for asset in assets
    ]

@router.put("/asset/{asset_id}/status")
async def update_asset_status(asset_id: int, status: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check permissions
    if current_user.get("role") not in ["admin", "manager"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    
    if status not in ["scheduled", "in_progress", "done"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
    
    asset.scheduled_status = status
    db.commit()
    
    return {"message": "Asset status updated successfully"}