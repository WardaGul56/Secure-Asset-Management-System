from fastapi import APIRouter, HTTPException, Depends
from database import get_vault_db, close_db
from auth_utils import require_role

router = APIRouter()

@router.get("/geofence")
def get_geofence_breaches(user=Depends(require_role(["admin"]))):
    vault_conn = get_vault_db()
    vault_cur = vault_conn.cursor()

    try:
        vault_cur.execute(
            """
            select gb_id, log_id, asset_id, zone_id, detected_at
            from geofence_breach
            order by detected_at desc
            """
        )
        rows = vault_cur.fetchall()

        breaches_list = [
            {
                "gb_id": row[0],
                "log_id": row[1],
                "asset_id": row[2],
                "zone_id": row[3],
                "detected_at": str(row[4])
            }
            for row in rows
        ]

        return {"geofence_breaches": breaches_list}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(vault_conn, vault_cur)

# admins only — view all sql injection attempts from vault db

@router.get("/sqli")
def get_sqli_breaches(user=Depends(require_role(["admin"]))):
    vault_conn = get_vault_db()
    vault_cur = vault_conn.cursor()

    try:
        vault_cur.execute(
            """
            select sb_id, attacker_ip, malicious_input, timestamp, session_id
            from sql_breach
            order by timestamp desc
            """
        )
        rows = vault_cur.fetchall()

        attempts_list = [
            {
                "sb_id": row[0],
                "attacker_ip": row[1],
                "malicious_input": row[2],
                "timestamp": str(row[3]),
                "session_id": row[4]
            }
            for row in rows
        ]

        return {"sqli_attempts": attempts_list}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(vault_conn, vault_cur)


# admins only — view both breach types together
@router.get("/all")
def get_all_breaches(user=Depends(require_role(["admin"]))):
    vault_conn = get_vault_db()
    vault_cur = vault_conn.cursor()

    try:
        vault_cur.execute(
            "select gb_id, log_id, asset_id, zone_id, detected_at from geofence_breach order by detected_at desc"
        )
        geofence_rows = vault_cur.fetchall()

        vault_cur.execute(
            "select sb_id, attacker_ip, malicious_input, timestamp, session_id from sql_breach order by timestamp desc"
        )
        sqli_rows = vault_cur.fetchall()

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
                    "timestamp": str(row[3]),
                    "session_id": row[4]
                }
                for row in sqli_rows
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(vault_conn, vault_cur)


