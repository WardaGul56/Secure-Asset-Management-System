# routes/location.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_main_db, close_db
from auth_utils import require_role

router = APIRouter()

# request model
class LocationInput(BaseModel):
    asset_id: int
    latitude: float
    longitude: float

# POST /location/log
# operators log their truck location
# this insert fires the postgis breach trigger automatically
@router.post("/log")
def log_location(data: LocationInput, user=Depends(require_role(["operator"]))):

    conn = get_main_db()
    cur = conn.cursor()

    try:
        # get operator info only
        cur.execute(
            "SELECT op_id, active_status FROM operators WHERE user_id = %s",
            (user["user_id"],)
        )

        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="operator not found")

        if not result[1]:
            raise HTTPException(status_code=403, detail="operator inactive")

        op_id = result[0]

        # DB handles assignment check + insert
        cur.execute(
            "SELECT log_location_fn(%s, %s, %s, %s)",
            (data.asset_id, op_id, data.latitude, data.longitude)
        )

        log_id = cur.fetchone()[0]
        conn.commit()

        return {
            "message": "location logged successfully",
            "log_id": log_id
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)

# GET /location/latest
# returns latest location of every active asset
# used by security patrol manager for live map
@router.get("/latest")
def get_latest_locations(user=Depends(require_role(["admin", "manager"]))):

    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM latest_locations_view")
        rows = cur.fetchall()

        return {
            "locations": [
                {
                    "asset_id": r[0],
                    "asset_name": r[1],
                    "plate_number": r[2],
                    "op_id": r[3],
                    "latitude": r[4],
                    "longitude": r[5],
                    "timestamp": str(r[6])
                }
                for r in rows
            ]
        }

    finally:
        close_db(conn, cur)

# GET /location/history/{asset_id}
# full location history for a specific truck
@router.get("/history/{asset_id}")
def get_location_history(asset_id: int, user=Depends(require_role(["admin", "manager"]))):

    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT *
            FROM location_history_view
            WHERE asset_id = %s
            ORDER BY time_stamp DESC
            """,
            (asset_id,)
        )

        rows = cur.fetchall()

        return {
            "history": [
                {
                    "log_id": r[0],
                    "asset_id": r[1],
                    "op_id": r[2],
                    "latitude": r[3],
                    "longitude": r[4],
                    "timestamp": str(r[5])
                }
                for r in rows
            ]
        }

    finally:
        close_db(conn, cur)