# routes/honeypot.py

from fastapi import APIRouter, HTTPException, Depends, Request
from database import get_main_db, get_vault_db, close_db
from auth_utils import require_role
import re

router = APIRouter()

# ============================================
# sql injection patterns to detect
# ============================================
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


# ============================================
# GET /search/asset
# honeypot — looks like a real search feature
# operators and managers can see this in ui
# ============================================
@router.get("/asset")
def honeypot_search(query: str, request: Request, user=Depends(require_role(["admin", "manager", "operator"]))):
    # check for sql injection attempt
    if is_sqli(query):
        # log to vault db
        vault_conn = get_vault_db()
        vault_cur = vault_conn.cursor()

        try:
            attacker_ip = request.client.host
            session_id = request.cookies.get("session_id", "unknown")

            vault_cur.execute(
                """
                insert into sql_breach (attacker_ip, malicious_input, timestamp, session_id)
                values (%s, %s, current_timestamp, %s)
                """,
                (attacker_ip, query, session_id)
            )
            vault_conn.commit()

        except Exception as e:
            vault_conn.rollback()
            print(f"failed to log sqli attempt: {e}")

        finally:
            close_db(vault_conn, vault_cur)

        # return empty result — attacker thinks search just found nothing
        # they do not know they were detected and logged
        return {"results": [], "message": "no assets found"}

    # no injection detected — query dummy table normally
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            select fake_asset_name, fake_location
            from dummy
            where fake_asset_name ilike %s
            """,
            (f"%{query}%",)
        )
        rows = cur.fetchall()

        results = [
            {
                "asset_name": row[0],
                "location": row[1]
            }
            for row in rows
        ]

        return {"results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)