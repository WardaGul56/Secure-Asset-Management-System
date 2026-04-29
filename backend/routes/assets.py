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


@router.post("/create")
def create_asset(data: AssetInput, user=Depends(require_role(["admin"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "select asset_id from asset where plate_number = %s",
            (data.plate_number,)
        )
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="plate number already exists")

        cur.execute(
            """
            insert into asset (asset_name, plate_number, scheduled_status)
            values (%s, %s, 'scheduled')
            returning asset_id
            """,
            (data.asset_name, data.plate_number)
        )
        asset_id = cur.fetchone()[0]
        conn.commit()

        return {
            "message": "asset created successfully",
            "asset_id": asset_id,
            "asset_name": data.asset_name,
            "plate_number": data.plate_number
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)

@router.get("/all")
def get_all_assets(user=Depends(require_role(["admin", "manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            select asset_id, asset_name, plate_number, scheduled_status
            from asset
            order by asset_id desc
            """
        )
        rows = cur.fetchall()

        assets_list = [
            {
                "asset_id": row[0],
                "asset_name": row[1],
                "plate_number": row[2],
                "scheduled_status": row[3]
            }
            for row in rows
        ]

        return {"assets": assets_list}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)

@router.put("/status")
def update_asset_status(data: UpdateStatusInput, user=Depends(require_role(["manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "select department from fleet_manager where user_id = %s",
            (user["user_id"],)
        )
        result = cur.fetchone()
        if not result or result[0] != "logistics":
            raise HTTPException(status_code=403, detail="only logistics managers can update asset status")

        if data.scheduled_status not in ["scheduled", "in_progress", "done"]:
            raise HTTPException(status_code=400, detail="invalid status value")

        cur.execute("select asset_id from asset where asset_id = %s", (data.asset_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="asset not found")

        cur.execute(
            "update asset set scheduled_status = %s where asset_id = %s",
            (data.scheduled_status, data.asset_id)
        )
        conn.commit()

        return {"message": "asset status updated successfully"}

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)

@router.get("/{asset_id}")
def get_asset(asset_id: int, user=Depends(require_role(["admin", "manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            select asset_id, asset_name, plate_number, scheduled_status
            from asset
            where asset_id = %s
            """,
            (asset_id,)
        )
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
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)