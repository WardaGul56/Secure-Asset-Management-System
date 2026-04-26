# routes/users.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from database import get_main_db, close_db
from auth_utils import require_role, hash_password

router = APIRouter()

# ============================================
# request models
# ============================================
class CreateUserInput(BaseModel):
    name: str
    email: EmailStr
    role: str  # 'admin', 'manager', 'operator'
    department: str | None = None  # only for managers: 'logistics' or 'security_patrol'
    manager_id: str | None = None  # only for operators


class DeactivateUserInput(BaseModel):
    user_id: int


# ============================================
# helper — generate username automatically
# format: admin_001, manager_001, op_001
# ============================================
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


# ============================================
# POST /users/create
# only admins can create accounts
# ============================================
@router.post("/create")
def create_user(data: CreateUserInput, user=Depends(require_role(["admin"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # validate role
        if data.role not in ["admin", "manager", "operator"]:
            raise HTTPException(status_code=400, detail="invalid role")

        # validate department if manager
        if data.role == "manager" and data.department not in ["logistics", "security_patrol"]:
            raise HTTPException(status_code=400, detail="managers need a valid department")

        # validate manager_id if operator
        if data.role == "operator" and not data.manager_id:
            raise HTTPException(status_code=400, detail="operators need a manager_id")

        # check email not already used
        cur.execute("select user_id from users where email = %s", (data.email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="email already exists")

        # insert into users base table
        cur.execute(
            """
            insert into users (name, email, role, is_active)
            values (%s, %s, %s, true)
            returning user_id
            """,
            (data.name, data.email, data.role)
        )
        user_id = cur.fetchone()[0]

        # generate username
        username = generate_username(cur, data.role)

        # default password is username itself — admin shares it with the person
        # they should change it after first login (future enhancement)
        default_password = username
        pass_hash = hash_password(default_password)

        # insert into role specific sub table
        if data.role == "admin":
            cur.execute(
                """
                insert into security_admin (admin_id, user_id, username)
                values (%s, %s, %s)
                """,
                (username, user_id, username)
            )

        elif data.role == "manager":
            cur.execute(
                """
                insert into fleet_manager (manager_id, user_id, username, department)
                values (%s, %s, %s, %s)
                """,
                (username, user_id, username, data.department)
            )

        elif data.role == "operator":
            # verify manager exists
            cur.execute(
                "select manager_id from fleet_manager where manager_id = %s",
                (data.manager_id,)
            )
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="manager not found")

            cur.execute(
                """
                insert into operators (op_id, user_id, username, manager_id, active_status)
                values (%s, %s, %s, %s, false)
                """,
                (username, user_id, username, data.manager_id)
            )

        # insert into passwords table
        cur.execute(
            """
            insert into passwords (username, pass_hash, user_id)
            values (%s, %s, %s)
            """,
            (username, pass_hash, user_id)
        )

        conn.commit()

        return {
            "message": "user created successfully",
            "username": username,
            "default_password": default_password,  # shown once so admin can share it
            "role": data.role
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"server error: {e}")

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
        # check user exists
        cur.execute("select user_id, is_active from users where user_id = %s", (data.user_id,))
        result = cur.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="user not found")

        if not result[1]:
            raise HTTPException(status_code=400, detail="user is already deactivated")

        cur.execute(
            "update users set is_active = false where user_id = %s",
            (data.user_id,)
        )
        conn.commit()

        return {"message": "user deactivated successfully"}

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)


# ============================================
# GET /users/all
# only admins can view all users
# ============================================
@router.get("/all")
def get_all_users(user=Depends(require_role(["admin"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            select user_id, name, email, role, joining_date, is_active
            from users
            order by joining_date desc
            """
        )
        rows = cur.fetchall()

        users_list = [
            {
                "user_id": row[0],
                "name": row[1],
                "email": row[2],
                "role": row[3],
                "joining_date": str(row[4]),
                "is_active": row[5]
            }
            for row in rows
        ]

        return {"users": users_list}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)