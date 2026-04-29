# routes/users.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from database import get_main_db, close_db
from auth_utils import require_role, hash_password

router = APIRouter()

# request models
class CreateUserInput(BaseModel):
    name: str
    email: EmailStr
    role: str  #'admin','manager','operator'
    department: str | None = None  # only for managers: 'logistics' or 'security_patrol' for others it will be set to None
    manager_id: str | None = None  # only for operators

class DeactivateUserInput(BaseModel):
    user_id: int

# this generates username automatically
# format: admin_001, manager_001, op_001
def generate_username(cur, role: str) -> str:
    if role == "admin":
        prefix = "admin"
        table = "security_admin"
        id_col = "admin_id"
    elif role == "manager":
        prefix = "manager"
        table = "fleet_manager"
        id_col = "manager_id"
    elif role == "operator":
        prefix = "op"
        table = "operators"
        id_col = "op_id"
    else:
        raise HTTPException(status_code=400, detail="invalid role")

    # count existing entries to generate next number
    cur.execute(f"select count(*) from {table}")
    count = cur.fetchone()[0]
    number = str(count + 1).zfill(3)  # pads to 3 digits: 001, 002, 003
    return f"{prefix}_{number}"

# POST /users/create
# only admins can create accounts
@router.post("/create")
def create_user(data: CreateUserInput, user=Depends(require_role(["admin"]))):

    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT * FROM create_user_fn(%s, %s, %s, %s, %s)
            """,
            (data.name, data.email, data.role, data.department, data.manager_id)
        )

        result = cur.fetchone()
        conn.commit()

        return {
            "message": "user created successfully",
            "username": result[0],
            "user_id": result[1],
            "default_password": result[2]
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)

# PUT /users/deactivate
# only admins can deactivate accounts
@router.put("/deactivate")
def deactivate_user(data: DeactivateUserInput, user=Depends(require_role(["admin"]))):

    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT deactivate_user_fn(%s)", (data.user_id,))
        conn.commit()

        return {"message": "user deactivated successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)

# GET /users/all
# only admins can view all users
@router.get("/all")
def get_all_users(user=Depends(require_role(["admin"]))):

    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM users_view")
        rows = cur.fetchall()

        return {
            "users": [
                {
                    "user_id": r[0],
                    "name": r[1],
                    "email": r[2],
                    "role": r[3],
                    "joining_date": str(r[4]),
                    "is_active": r[5]
                }
                for r in rows
            ]
        }

    finally:
        close_db(conn, cur)