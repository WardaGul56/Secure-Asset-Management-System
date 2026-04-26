from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import User, SecurityAdmin, FleetManager, Operator, Password
from ..auth_utils import get_current_user, hash_password
from typing import Optional

router = APIRouter()

class UserCreate(BaseModel):
    name: str
    email: str
    role: str  # 'admin', 'manager', 'operator'
    username: str
    password: str
    department: Optional[str] = None  # for managers
    manager_id: Optional[str] = None  # for operators

@router.post("/create-user")
async def create_user(user_data: UserCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if current user is superadmin (assuming admin role is superadmin)
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only superadmin can create users")
    
    # Check if email or username already exists
    existing_user = db.query(User).filter((User.email == user_data.email) | (User.username == user_data.username)).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or username already exists")
    
    # Create user
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create password
    hashed_password = hash_password(user_data.password)
    new_password = Password(
        username=user_data.username,
        pass_hash=hashed_password,
        user_id=new_user.user_id
    )
    db.add(new_password)
    
    # Create role-specific entry
    if user_data.role == "admin":
        new_admin = SecurityAdmin(
            admin_id=f"ADM{new_user.user_id:04d}",
            user_id=new_user.user_id,
            username=user_data.username
        )
        db.add(new_admin)
    elif user_data.role == "manager":
        new_manager = FleetManager(
            manager_id=f"MGR{new_user.user_id:04d}",
            user_id=new_user.user_id,
            username=user_data.username,
            department=user_data.department
        )
        db.add(new_manager)
    elif user_data.role == "operator":
        new_operator = Operator(
            op_id=f"OP{new_user.user_id:04d}",
            user_id=new_user.user_id,
            username=user_data.username,
            manager_id=user_data.manager_id
        )
        db.add(new_operator)
    
    db.commit()
    return {"message": "User created successfully", "user_id": new_user.user_id}