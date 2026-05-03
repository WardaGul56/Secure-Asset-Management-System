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
    if is_sqli(data.username) or is_sqli(data.password):
        vault_conn = get_vault_db()
        vault_cur = vault_conn.cursor()
        try:
            attacker_ip = request.client.host
            # Session ID: try cookie, fall back to a generated trace id from IP
            session_id = request.cookies.get("session_id") or request.cookies.get("sessionid") or f"ip-{attacker_ip}"
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

        fake_token = create_token({
            "user_id": -1,
            "username": data.username,
            "role": "honeypot"
        })

        return {
            "token": fake_token,
            "role": "honeypot",
            "username": data.username
        }

    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT * FROM login_user_fn(%s::text)",
            (data.username,)
        )
        result = cur.fetchone()

        if not result:
            raise HTTPException(status_code=401, detail="Invalid username or password")

        user_id, username, role, is_active, pass_hash = result

        if not is_active:
            raise HTTPException(status_code=403, detail="Your account has been deactivated. Contact an administrator.")

        if not verify_password(data.password, pass_hash):
            raise HTTPException(status_code=401, detail="Invalid username or password")

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
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")
    finally:
        close_db(conn, cur)


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
