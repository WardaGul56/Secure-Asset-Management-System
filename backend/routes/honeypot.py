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


@router.get("/data")
def honeypot_data(
    request: Request,
):
    conn = get_main_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT asset_name_fake, location_fake FROM honeypot_assets_view")
        rows = cur.fetchall()
        return {
            "results": [
                {"asset_name": r[0], "location": r[1]}
                for r in rows
            ]
        }
    finally:
        close_db(conn, cur)