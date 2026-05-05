from fastapi import APIRouter, HTTPException, Depends
from database import get_vault_db, close_db
from auth_utils import require_role

router = APIRouter()

# GEofence breaches only
@router.get("/geofence")
def get_geofence_breaches(user=Depends(require_role(["admin"]))):
    conn = get_vault_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM geofence_breaches_view")
        rows = cur.fetchall()

        return {
            "geofence_breaches": [
                {
                    "gb_id": row[0],
                    "log_id": row[1],
                    "asset_id": row[2],
                    "zone_id": row[3],
                    "detected_at": str(row[4])
                }
                for row in rows
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)


@router.get("/sqli")
def get_sqli_breaches(user=Depends(require_role(["admin"]))):
    conn = get_vault_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM sqli_breaches_view")
        rows = cur.fetchall()
        return {
            "sqli_attempts": [
                {
                    "sb_id": row[0],
                    "attacker_ip": row[1],
                    "malicious_input": row[2],
                    "time_stamp": str(row[3]),   # was "timestamp"
                    "session_id": row[4]
                }
                for row in rows
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_db(conn, cur)


@router.get("/all")
def get_all_breaches(user=Depends(require_role(["admin"]))):
    conn = get_vault_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM geofence_breaches_view")
        geofence_rows = cur.fetchall()

        cur.execute("SELECT * FROM sqli_breaches_view")
        sqli_rows = cur.fetchall()

        return {
            "geofence_breaches": [
                {
                    "gb_id": row[0],
                    "log_id": row[1],
                    "asset_id": row[2],
                    "zone_id": row[3],
                    "detected_at": str(row[4])
                }
                for row in geofence_rows
            ],
            "sqli_attempts": [
                {
                    "sb_id": row[0],
                    "attacker_ip": row[1],
                    "malicious_input": row[2],
                    "time_stamp": str(row[3]),   # was "timestamp"
                    "session_id": row[4]
                }
                for row in sqli_rows
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_db(conn, cur)