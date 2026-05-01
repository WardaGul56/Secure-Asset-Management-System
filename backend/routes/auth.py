from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_main_db, close_db
from auth_utils import verify_password, create_token

router = APIRouter()

class LoginInput(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(data: LoginInput):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT * FROM login_user_fn(%s::text)",
            (data.username,)
        )

        result = cur.fetchone()

        # 1. user not found
        if not result:
            raise HTTPException(status_code=401, detail="invalid credentials")

        user_id, username, role, is_active, pass_hash = result

        # 2. account status check
        if not is_active:
            raise HTTPException(status_code=403, detail="account is deactivated")

        # 3. password check
        if not verify_password(data.password, pass_hash):
            raise HTTPException(status_code=401, detail="invalid credentials")

        # 4. JWT creation
        token = create_token({
            "user_id": user_id,
            "username": username,
            "role": role
        })

        return {
            "token": token,
            "role": role,
            "username": username
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)

@router.post("/logout")
def logout():
    return {"message": "logged out successfully"}