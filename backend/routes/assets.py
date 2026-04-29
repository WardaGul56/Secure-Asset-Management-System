from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_main_db, close_db
from auth_utils import require_role

router = APIRouter()

class AssetInput(BaseModel):
    asset_name: str
    plate_number: str

class UpdateStatusInput(BaseModel):
    asset_id: int
    scheduled_status: str


# POST /assets/create
# only admins can register new trucks
@router.post("/create")
def create_asset(data: AssetInput, user=Depends(require_role(["admin"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT * FROM create_asset_fn(%s, %s)",
            (data.asset_name, data.plate_number)
        )
        result = cur.fetchone()
        conn.commit()

        return {
            "message": "asset created successfully",
            "asset_id": result[0],
            "asset_name": result[1],
            "plate_number": result[2]
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)


# GET /assets/all
# admins and managers can view all trucks
@router.get("/all")
def get_all_assets(user=Depends(require_role(["admin", "manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM assets_view")
        rows = cur.fetchall()

        return {
            "assets": [
                {
                    "asset_id": r[0],
                    "asset_name": r[1],
                    "plate_number": r[2],
                    "scheduled_status": r[3]
                }
                for r in rows
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)


# PUT /assets/status
# only logistics managers can update truck status
@router.put("/status")
def update_asset_status(data: UpdateStatusInput, user=Depends(require_role(["manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT update_asset_status_fn(%s, %s, %s)",
            (data.asset_id, data.scheduled_status, user["user_id"])
        )
        conn.commit()

        return {"message": "asset status updated successfully"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)


# GET /assets/{asset_id}
# admins and managers can view a single truck
@router.get("/{asset_id}")
def get_asset(asset_id: int, user=Depends(require_role(["admin", "manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM get_asset_fn(%s)", (asset_id,))
        row = cur.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="asset not found")

        return {
            "asset_id": row[0],
            "asset_name": row[1],
            "plate_number": row[2],
            "scheduled_status": row[3]
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)