from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import Assignment, FleetManager, Operator, Asset
from ..auth_utils import get_current_user
from typing import List

router = APIRouter()

class AssignmentCreate(BaseModel):
    op_id: str
    asset_id: int

class AssignmentResponse(BaseModel):
    assignment_id: int
    manager_id: str
    op_id: str
    asset_id: int
    assigned_at: str
    status: str

@router.post("/assign")
async def create_assignment(assignment_data: AssignmentCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Only managers can create assignments
    if current_user.get("role") != "manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers can create assignments")
    
    # Get manager
    manager = db.query(FleetManager).filter(FleetManager.user_id == current_user["user_id"]).first()
    
    # Check if operator belongs to this manager
    operator = db.query(Operator).filter(Operator.op_id == assignment_data.op_id).first()
    if not operator or operator.manager_id != manager.manager_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Operator not found or not under your management")
    
    # Check if asset exists
    asset = db.query(Asset).filter(Asset.asset_id == assignment_data.asset_id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    
    # Check if operator is already assigned to an asset
    existing_assignment = db.query(Assignment).filter(
        Assignment.op_id == assignment_data.op_id,
        Assignment.status == "active"
    ).first()
    if existing_assignment:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Operator already assigned to an asset")
    
    # Create assignment
    new_assignment = Assignment(
        manager_id=manager.manager_id,
        op_id=assignment_data.op_id,
        asset_id=assignment_data.asset_id
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    
    return {"message": "Assignment created successfully", "assignment_id": new_assignment.assignment_id}

@router.get("/assignments", response_model=List[AssignmentResponse])
async def get_assignments(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.get("role") == "manager":
        manager = db.query(FleetManager).filter(FleetManager.user_id == current_user["user_id"]).first()
        assignments = db.query(Assignment).filter(Assignment.manager_id == manager.manager_id).all()
    elif current_user.get("role") == "admin":
        assignments = db.query(Assignment).all()
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    return [
        AssignmentResponse(
            assignment_id=assignment.assignment_id,
            manager_id=assignment.manager_id,
            op_id=assignment.op_id,
            asset_id=assignment.asset_id,
            assigned_at=str(assignment.assigned_at),
            status=assignment.status
        ) for assignment in assignments
    ]

@router.put("/assignment/{assignment_id}/complete")
async def complete_assignment(assignment_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.assignment_id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    
    # Check permissions
    if current_user.get("role") == "manager":
        manager = db.query(FleetManager).filter(FleetManager.user_id == current_user["user_id"]).first()
        if assignment.manager_id != manager.manager_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only manage your own assignments")
    elif current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    assignment.status = "completed"
    db.commit()
    
    return {"message": "Assignment completed successfully"}