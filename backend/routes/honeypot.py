# routes/honeypot.py
from fastapi import APIRouter, HTTPException, Depends, Request
from database import get_main_db, get_vault_db, close_db
from auth_utils import require_role
import re

router = APIRouter()

router = APIRouter()

# sql injection patterns to detect
SQLI_PATTERNS = [
    r"(\%27)|(\')|(\-\-)|(\%23)|(#)",           # quotes and comment operators
    r"\b(union|select|drop|insert|delete|update|exec|cast|alter|create)\b",  # sql keywords
    r"(1\s*=\s*1|or\s+1|and\s+1)",              # boolean injection
    r"(\%3D)|(=)|(\%2F)|(\/\*)",                 # encoded characters
    r"\b(sleep|benchmark|waitfor|delay)\b"        # time based injection
]


def is_sqli(query: str) -> bool:
    for pattern in SQLI_PATTERNS:
        if re.search(pattern, query, re.IGNORECASE):
            return True
    return False

# GET /search/asset
# honeypot — looks like a real search feature
# operators and managers can see this in ui
@router.get("/asset")
def honeypot_search(
    query: str,
    request: Request,
    user=Depends(require_role(["admin", "manager", "operator"]))
):

    # ---------------------------
    # DETECT ATTACK (Python layer)
    # ---------------------------
    if is_sqli(query):

        vault_conn = get_vault_db()
        vault_cur = vault_conn.cursor()

        try:
            ip = request.client.host
            session = request.cookies.get("session_id", "unknown")

            # DB handles logging
            vault_cur.execute(
                "SELECT log_sqli_attempt(%s, %s, %s)",
                (ip, query, session)
            )

            vault_conn.commit()

        except Exception as e:
            vault_conn.rollback()
            print("vault logging failed:", e)

        finally:
            close_db(vault_conn, vault_cur)

        return {"results": [], "message": "no assets found"}

    # ---------------------------
    # NORMAL HONEYPOT QUERY
    # ---------------------------
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT asset_name_fake, location_fake
            FROM honeypot_assets_view
            WHERE asset_name_fake ILIKE %s
            """,
            (f"%{query}%",)
        )

        rows = cur.fetchall()

        return {
            "results": [
                {
                    "asset_name": r[0],
                    "location": r[1]
                }
                for r in rows
            ]
        }

    finally:
        close_db(conn, cur)