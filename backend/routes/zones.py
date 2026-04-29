# routes/zones.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_main_db, close_db
from auth_utils import require_role

router = APIRouter()

#request models -- what should we expect while receiving a JSON response
class ZoneInput(BaseModel):
    zone_name: str
    is_forbidden: bool
    coordinates: list[list[float]]
    # coordinates come as a list of [longitude, latitude] pairs
    # example: [[73.0, 33.0], [73.1, 33.0], [73.1, 33.1], [73.0, 33.1], [73.0, 33.0]]
    # first and last coordinate must be the same to close the polygon

# following converts coordinate list to well known text polygon
# well known text is what postgis understands
# example output: POLYGON((73.0 33.0, 73.1 33.0, ...))
def coords_to_wkt(coordinates: list[list[float]]) -> str:
    if coordinates[0] != coordinates[-1]:
        coordinates.append(coordinates[0])  # auto close polygon if not closed
    coord_str = ", ".join(f"{lon} {lat}" for lon, lat in coordinates)
    return f"POLYGON(({coord_str}))"

# POST /zones/create
# only admins can create zones
@router.post("/create")
def create_zone(data: ZoneInput, user=Depends(require_role(["admin"]))):
    conn = get_main_db()
    cur = conn.cursor()
    try:
        if len(data.coordinates) < 3:
            raise HTTPException(status_code=400, detail="At least 3 coordinates required")
        wkt = coords_to_wkt(data.coordinates)
        cur.execute(
            "SELECT create_zone_fn(%s, %s, %s, %s)",
            (data.zone_name, data.is_forbidden, wkt, user["user_id"])
        )
        zone_id = cur.fetchone()[0]
        conn.commit()
        return {
            "message": "zone created successfully",
            "zone_id": zone_id
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)

# GET /zones/all
# all roles can view zones — needed for map display
@router.get("/all")
def get_all_zones(user=Depends(require_role(["admin", "manager", "operator"]))):

    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM zones_view")
        rows = cur.fetchall()

        return {
            "zones": [
                {
                    "zone_id": r[0],
                    "zone_name": r[1],
                    "is_forbidden": r[2],
                    "created_by": r[3],
                    "boundary": r[4]
                }
                for r in rows
            ]
        }

    finally:
        close_db(conn, cur)

@router.get("/{zone_id}")
def get_zone(zone_id: int, user=Depends(require_role(["admin", "manager", "operator"]))):

    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM get_zone_fn(%s)", (zone_id,))
        row = cur.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="zone not found")

        return {
            "zone_id": row[0],
            "zone_name": row[1],
            "is_forbidden": row[2],
            "created_by": row[3],
            "boundary": row[4]
        }

    finally:
        close_db(conn, cur)


@router.delete("/{zone_id}")
def delete_zone(zone_id: int, user=Depends(require_role(["admin"]))):

    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT delete_zone_fn(%s)", (zone_id,))
        conn.commit()

        return {"message": "zone deleted successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)
