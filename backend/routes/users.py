# routes/users.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from database import get_main_db, close_db
from auth_utils import require_role
import re

router = APIRouter()

def friendly_error(e: Exception) -> str:
    msg = str(e)
    msg = re.split(r'\nCONTEXT:', msg)[0]
    msg = re.split(r'\nDETAIL:', msg)[0]
    msg = re.sub(r'^ERROR:\s*', '', msg.strip())
    msg = re.sub(r'SQLSTATE\[.*?\]', '', msg).strip()
    return msg or "An unexpected error occurred"

# ============================================
# request models
# ============================================
class CreateUserInput(BaseModel):
    name: str
    email: EmailStr
    role: str                       # 'admin', 'manager', 'operator'
    department: str | None = None   # required for managers only
    manager_id: str | None = None   # required for operators only

class DeactivateUserInput(BaseModel):
    user_id: int


# ============================================
# POST /users/create
# only admins can create accounts
# ============================================
@router.post("/create")
def create_user(data: CreateUserInput, user=Depends(require_role(["admin"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT * FROM create_user_fn(%s, %s, %s, %s, %s)",
            (data.name, data.email, data.role, data.department, data.manager_id)
        )
        result = cur.fetchone()
        conn.commit()

        return {
            "message": "User created successfully",
            "username": result[0],
            "user_id": result[1],
            "default_password": result[2]
        }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=friendly_error(e))
    finally:
        close_db(conn, cur)


# ============================================
# PUT /users/deactivate
# only admins can deactivate accounts
# ============================================
@router.put("/deactivate")
def deactivate_user(data: DeactivateUserInput, user=Depends(require_role(["admin"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT deactivate_user_fn(%s)", (data.user_id,))
        conn.commit()

        return {"message": "User deactivated successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=friendly_error(e))
    finally:
        close_db(conn, cur)


# ============================================
# GET /users/all
# only admins can view all users (descending by user_id)
# ============================================
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

    except Exception as e:
        raise HTTPException(status_code=500, detail=friendly_error(e))
    finally:
        close_db(conn, cur)


# ============================================
# GET /users/managers
# admin can get list of managers for dropdowns
# ============================================
@router.get("/managers")
def get_managers(user=Depends(require_role(["admin"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM active_managers_view")
        rows = cur.fetchall()

        return {
            "managers": [
                {
                    "manager_id": r[0],
                    "name": r[1],
                    "user_id": r[2],
                    "department": r[3]
                }
                for r in rows
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=friendly_error(e))
    finally:
        close_db(conn, cur)