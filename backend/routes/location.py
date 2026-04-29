# routes/location.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_main_db, close_db
from auth_utils import require_role

router = APIRouter()

# ============================================
# request model
# ============================================
class LocationInput(BaseModel):
    asset_id: int
    latitude: float
    longitude: float


# ============================================
# POST /location/log
# operators log their truck location
# this insert fires the postgis breach trigger automatically
# ============================================
@router.post("/log")
def log_location(data: LocationInput, user=Depends(require_role(["operator"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # get op_id from token user_id
        cur.execute(
            "select op_id, active_status from operators where user_id = %s",
            (user["user_id"],)
        )
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="operator not found")
        if not result[1]:
            raise HTTPException(status_code=403, detail="operator is not active")
        op_id = result[0]

        # verify this operator is actually assigned to this asset
        cur.execute(
            """
            select assignment_id from assignment
            where op_id = %s and asset_id = %s and status = 'active'
            """,
            (op_id, data.asset_id)
        )
        if not cur.fetchone():
            raise HTTPException(status_code=403, detail="you are not assigned to this asset")

        # validate coordinate ranges
        if not (-90 <= data.latitude <= 90):
            raise HTTPException(status_code=400, detail="invalid latitude")
        if not (-180 <= data.longitude <= 180):
            raise HTTPException(status_code=400, detail="invalid longitude")

        # insert location log
        # ST_SetSRID(ST_MakePoint(lon, lat), 4326) builds the postgis point
        # note: ST_MakePoint takes longitude first, then latitude
        # the breach trigger fires automatically after this insert
        cur.execute(
            """
            insert into location_logs (asset_id, op_id, current_location)
            values (%s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
            returning log_id
            """,
            (data.asset_id, op_id, data.longitude, data.latitude)
        )
        log_id = cur.fetchone()[0]
        conn.commit()

        return {
            "message": "location logged successfully",
            "log_id": log_id,
            "asset_id": data.asset_id,
            "latitude": data.latitude,
            "longitude": data.longitude
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)


# ============================================
# GET /location/latest
# returns latest location of every active asset
# used by security patrol manager for live map
# ============================================
@router.get("/latest")
def get_latest_locations(user=Depends(require_role(["admin", "manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # distinct on asset_id picks latest log per asset
        cur.execute(
            """
            select distinct on (ll.asset_id)
                ll.asset_id,
                a.asset_name,
                a.plate_number,
                ll.op_id,
                ST_Y(ll.current_location::geometry) as latitude,
                ST_X(ll.current_location::geometry) as longitude,
                ll.time_stamp
            from location_logs ll
            join asset a on ll.asset_id = a.asset_id
            order by ll.asset_id, ll.time_stamp desc
            """
        )
        rows = cur.fetchall()

        locations_list = [
            {
                "asset_id": row[0],
                "asset_name": row[1],
                "plate_number": row[2],
                "op_id": row[3],
                "latitude": row[4],
                "longitude": row[5],
                "timestamp": str(row[6])
            }
            for row in rows
        ]

        return {"locations": locations_list}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)


# ============================================
# GET /location/history/{asset_id}
# full location history for a specific truck
# ============================================
@router.get("/history/{asset_id}")
def get_location_history(asset_id: int, user=Depends(require_role(["admin", "manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            select
                ll.log_id,
                ll.asset_id,
                ll.op_id,
                ST_Y(ll.current_location::geometry) as latitude,
                ST_X(ll.current_location::geometry) as longitude,
                ll.time_stamp
            from location_logs ll
            where ll.asset_id = %s
            order by ll.time_stamp desc
            """,
            (asset_id,)
        )
        rows = cur.fetchall()

        history_list = [
            {
                "log_id": row[0],
                "asset_id": row[1],
                "op_id": row[2],
                "latitude": row[3],
                "longitude": row[4],
                "timestamp": str(row[5])
            }
            for row in rows
        ]

        return {"history": history_list}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)