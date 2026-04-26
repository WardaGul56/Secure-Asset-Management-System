from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import Operator, FleetManager
from ..auth_utils import get_current_user
from typing import List

router = APIRouter()

class OperatorResponse(BaseModel):
    op_id: str
    user_id: int
    username: str
    manager_id: str
    active_status: bool

@router.get("/operators", response_model=List[OperatorResponse])
async def get_operators(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Managers can see their operators, admins can see all
    if current_user.get("role") == "manager":
        manager = db.query(FleetManager).filter(FleetManager.user_id == current_user["user_id"]).first()
        operators = db.query(Operator).filter(Operator.manager_id == manager.manager_id).all()
    elif current_user.get("role") == "admin":
        operators = db.query(Operator).all()
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    return [
        OperatorResponse(
            op_id=op.op_id,
            user_id=op.user_id,
            username=op.username,
            manager_id=op.manager_id,
            active_status=op.active_status
        ) for op in operators
    ]

@router.put("/operator/{op_id}/status")
async def update_operator_status(op_id: str, active_status: bool, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Only managers can update their operators' status, admins can update any
    operator = db.query(Operator).filter(Operator.op_id == op_id).first()
    if not operator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operator not found")
    
    if current_user.get("role") == "manager":
        manager = db.query(FleetManager).filter(FleetManager.user_id == current_user["user_id"]).first()
        if operator.manager_id != manager.manager_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only manage your own operators")
    elif current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    operator.active_status = active_status
    db.commit()
    
    return {"message": "Operator status updated successfully"}