# routes/zones.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_main_db, close_db
from auth_utils import require_role

router = APIRouter()

# ============================================
# request models
# ============================================
class ZoneInput(BaseModel):
    zone_name: str
    is_forbidden: bool
    # coordinates come as a list of [longitude, latitude] pairs
    # example: [[73.0, 33.0], [73.1, 33.0], [73.1, 33.1], [73.0, 33.1], [73.0, 33.0]]
    # first and last coordinate must be the same to close the polygon
    coordinates: list[list[float]]


# ============================================
# helper — converts coordinate list to WKT polygon
# WKT (well known text) is what postgis understands
# example output: POLYGON((73.0 33.0, 73.1 33.0, ...))
# ============================================
def coords_to_wkt(coordinates: list[list[float]]) -> str:
    if coordinates[0] != coordinates[-1]:
        coordinates.append(coordinates[0])  # auto close polygon if not closed
    coord_str = ", ".join(f"{lon} {lat}" for lon, lat in coordinates)
    return f"POLYGON(({coord_str}))"


# ============================================
# POST /zones/create
# only admins can create zones
# ============================================
@router.post("/create")
def create_zone(data: ZoneInput, user=Depends(require_role(["admin"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # validate minimum points for a polygon (at least 3 unique points)
        if len(data.coordinates) < 3:
            raise HTTPException(status_code=400, detail="polygon needs at least 3 coordinates")

        # convert coordinates to wkt format for postgis
        wkt = coords_to_wkt(data.coordinates)

        # get admin_id from security_admin using user_id from token
        cur.execute(
            "select admin_id from security_admin where user_id = %s",
            (user["user_id"],)
        )
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="admin not found")
        admin_id = result[0]

        # insert zone
        cur.execute(
            """
            insert into zones (zone_name, boundary, is_forbidden, created_by)
            values (%s, ST_GeomFromText(%s, 4326), %s, %s)
            returning zone_id
            """,
            (data.zone_name, wkt, data.is_forbidden, admin_id)
        )
        zone_id = cur.fetchone()[0]
        conn.commit()

        return {
            "message": "zone created successfully",
            "zone_id": zone_id,
            "zone_name": data.zone_name,
            "is_forbidden": data.is_forbidden
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
# GET /zones/all
# all roles can view zones — needed for map display
# ============================================
@router.get("/all")
def get_all_zones(user=Depends(require_role(["admin", "manager", "operator"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # ST_AsGeoJSON converts postgis geometry to geojson
        # react leaflet understands geojson natively
        cur.execute(
            """
            select zone_id, zone_name, is_forbidden, created_by,
                   ST_AsGeoJSON(boundary) as boundary
            from zones
            order by zone_id desc
            """
        )
        rows = cur.fetchall()

        zones_list = [
            {
                "zone_id": row[0],
                "zone_name": row[1],
                "is_forbidden": row[2],
                "created_by": row[3],
                "boundary": row[4]  # geojson string — leaflet uses this directly
            }
            for row in rows
        ]

        return {"zones": zones_list}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)


@router.delete("/{zone_id}")
def delete_zone(zone_id: int, user=Depends(require_role(["admin"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # check zone exists
        cur.execute("select zone_id from zones where zone_id = %s", (zone_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="zone not found")

        cur.execute("delete from zones where zone_id = %s", (zone_id,))
        conn.commit()

        return {"message": "zone deleted successfully"}

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)

@router.get("/{zone_id}")
def get_zone(zone_id: int, user=Depends(require_role(["admin", "manager", "operator"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            select zone_id, zone_name, is_forbidden, created_by,
                   ST_AsGeoJSON(boundary) as boundary
            from zones
            where zone_id = %s
            """,
            (zone_id,)
        )
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

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)