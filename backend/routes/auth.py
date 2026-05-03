# routes/auth.py

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from database import get_main_db, get_vault_db, close_db
from auth_utils import verify_password, create_token
import re

router = APIRouter()

class LoginInput(BaseModel):
    username: str
    password: str

# same patterns as honeypot
SQLI_PATTERNS = [
    r"(\%27)|(\')|(\-\-)|(\%23)|(#)",
    r"\b(union\s+select|drop\s+table|insert\s+into|delete\s+from)\b",
    r"('?\s*(or|and)\s*'?\d)",
    r"(\/\*|\*\/)",
    r"\b(sleep|benchmark|waitfor\s+delay)\b"
]

def is_sqli(value: str) -> bool:
    for pattern in SQLI_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            return True
    return False


@router.post("/login")
def login(data: LoginInput, request: Request):
    # check if username OR password contains SQL injection
    if is_sqli(data.username) or is_sqli(data.password):
        # log silently to vault db
        vault_conn = get_vault_db()
        vault_cur = vault_conn.cursor()
        try:
            attacker_ip = request.client.host
            session_id = request.cookies.get("session_id", "unknown")
            vault_cur.execute(
                "SELECT log_sqli_attempt(%s, %s, %s)",
                (attacker_ip, f"LOGIN ATTEMPT — username: {data.username} | password: {data.password}", session_id)
            )
            vault_conn.commit()
        except Exception as e:
            vault_conn.rollback()
            print("vault log failed:", e)
        finally:
            close_db(vault_conn, vault_cur)

        # return fake success — attacker thinks they're in
        fake_token = create_token({
            "user_id": -1,
            "username": data.username,
            "role": "honeypot"  # special role — frontend catches this
        })

        return {
            "token": fake_token,
            "role": "honeypot",
            "username": data.username
        }

    # normal login flow
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT * FROM login_user_fn(%s::text)",
            (data.username,)
        )
        result = cur.fetchone()

        if not result:
            raise HTTPException(status_code=401, detail="invalid credentials")

        user_id, username, role, is_active, pass_hash = result

        if not is_active:
            raise HTTPException(status_code=403, detail="account is deactivated")

        if not verify_password(data.password, pass_hash):
            raise HTTPException(status_code=401, detail="invalid credentials")

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