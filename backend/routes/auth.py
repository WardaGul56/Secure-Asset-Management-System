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
        # fetch password hash and user info using username
        # parameterized query — safe from sql injection
        cur.execute(
            """
            select p.pass_hash, p.user_id, u.role, u.is_active
            from passwords p
            join users u on p.user_id = u.user_id
            where p.username = %s
            """,
            (data.username,)
        )
        result = cur.fetchone()

        # username not found
        if not result:
            raise HTTPException(status_code=401, detail="invalid credentials")

        pass_hash, user_id, role, is_active = result

        # account deactivated
        if not is_active:
            raise HTTPException(status_code=403, detail="account is deactivated")

        # wrong password
        if not verify_password(data.password, pass_hash):
            raise HTTPException(status_code=401, detail="invalid credentials")

        # generate jwt token with user info embedded
        token = create_token({
            "user_id": user_id,
            "username": data.username,
            "role": role
        })

        return {
            "token": token,
            "role": role,
            "username": data.username
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)

@router.post("/logout")
def logout():
    return {"message": "logged out successfully"} #since JWT is stateless, logout is handled on the frontend by simply deleting the stored token. 