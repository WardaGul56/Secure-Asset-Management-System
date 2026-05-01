from fastapi import APIRouter, HTTPException, Depends, Request
from database import get_main_db, get_vault_db, close_db
from auth_utils import require_role
import re

router = APIRouter()  # was declared twice before, now just once

SQLI_PATTERNS = [
    r"(\%27)|(\-\-)|(\%23)",                              # encoded quote, comments (removed = which was too broad)
    r"\b(union\s+select|drop\s+table|insert\s+into|delete\s+from)\b",  # sql keyword pairs only
    r"('\s*(or|and)\s*'?\d)",                              # classic boolean injection
    r"(\/\*|\*\/)",                                        # block comments
    r"\b(sleep|benchmark|waitfor\s+delay)\b"              # time-based injection
]

def is_sqli(query: str) -> bool:
    for pattern in SQLI_PATTERNS:
        if re.search(pattern, query, re.IGNORECASE):
            return True
    return False


@router.get("/asset")
def honeypot_search(
    query: str,
    request: Request,
    user=Depends(require_role(["admin", "manager", "operator"]))
):
    if is_sqli(query):
        # Log silently to vault — attacker must not know they were detected
        vault_conn = get_vault_db()
        vault_cur = vault_conn.cursor()
        try:
            ip = request.client.host
            session = request.cookies.get("session_id", "unknown")
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

        # Return convincing fake data instead of empty response
        # Empty response would tip off the attacker that they were caught
        return {
            "results": [
                {"asset_name": "Ghost Truck Alpha", "location": "Warehouse 7, Sector G-9"},
                {"asset_name": "Shadow Van Beta",   "location": "Terminal B, Port Qasim"},
                {"asset_name": "Phantom Carrier X", "location": "Cold Storage, I-10"}
            ]
        }

    # Normal honeypot query — returns real dummy table data
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
                {"asset_name": r[0], "location": r[1]}
                for r in rows
            ]
        }
    finally:
        close_db(conn, cur)