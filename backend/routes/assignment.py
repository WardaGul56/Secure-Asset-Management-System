from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_main_db, close_db
from auth_utils import require_role
import re

router = APIRouter()

# MODELS
class AssignmentInput(BaseModel):
    op_id: str
    asset_id: int
class CompleteAssignmentInput(BaseModel):
    assignment_id: int
# =======================
# HELPER FUNCTION
# =======================
def friendly_error(e: Exception) -> str:
    msg = str(e)
    msg = re.split(r'\nCONTEXT:', msg)[0]
    msg = re.split(r'\nDETAIL:', msg)[0]
    msg = re.sub(r'^ERROR:\s*', '', msg.strip())
    msg = re.sub(r'SQLSTATE\[.*?\]', '', msg).strip()
    return msg or "An unexpected error occurred"


# =======================
# CREATE ASSIGNMENT
# =======================
@router.post("/create")
def create_assignment(data: AssignmentInput, user=Depends(require_role(["manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # check manager department
        cur.execute(
            "SELECT department FROM managers WHERE user_id = %s",
            (user["user_id"],)
        )
        mgr = cur.fetchone()

        if not mgr or mgr[0] != "logistics":
            raise HTTPException(
                status_code=403,
                detail="Only logistics managers can create assignments"
            )

        # check operator exists & active
        cur.execute(
            "SELECT active_status FROM operators WHERE op_id = %s",
            (data.op_id,)
        )
        op = cur.fetchone()

        if not op:
            raise HTTPException(status_code=404, detail="Operator not found")

        if not op[0]:
            raise HTTPException(
                status_code=400,
                detail="Operator is inactive"
            )

        # call DB function
        cur.execute(
            "SELECT * FROM create_assignment_fn(%s, %s, %s)",
            (user["user_id"], data.op_id, data.asset_id)
        )
        result = cur.fetchone()

        # update asset status
        cur.execute(
            "UPDATE assets SET scheduled_status = 'scheduled' WHERE asset_id = %s",
            (data.asset_id,)
        )

        conn.commit()

        return {
            "message": "assignment created successfully",
            "assignment_id": result[0],
            "op_id": data.op_id,
            "asset_id": data.asset_id
        }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=friendly_error(e))

    finally:
        close_db(conn, cur)


# =======================
# COMPLETE ASSIGNMENT
# =======================
@router.put("/complete")
def complete_assignment(data: CompleteAssignmentInput, user=Depends(require_role(["manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # check manager department
        cur.execute(
            "SELECT department FROM managers WHERE user_id = %s",
            (user["user_id"],)
        )
        mgr = cur.fetchone()

        if not mgr or mgr[0] != "logistics":
            raise HTTPException(
                status_code=403,
                detail="Only logistics managers can complete assignments"
            )

        # call DB function
        cur.execute(
            "SELECT complete_assignment_fn(%s, %s)",
            (data.assignment_id, user["user_id"])
        )

        # reset asset status
        cur.execute(
            """
            UPDATE assets
            SET scheduled_status = 'unscheduled'
            WHERE asset_id = (
                SELECT asset_id FROM assignments
                WHERE assignment_id = %s
            )
            """,
            (data.assignment_id,)
        )

        conn.commit()

        return {"message": "assignment marked as completed"}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=friendly_error(e))

    finally:
        close_db(conn, cur)


# =======================
# GET ALL ASSIGNMENTS
# =======================
@router.get("/all")
def get_all_assignments(user=Depends(require_role(["admin", "manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM assignments_view")
        rows = cur.fetchall()

        return {
            "assignments": [
                {
                    "assignment_id": row[0],
                    "manager_id": row[1],
                    "op_id": row[2],
                    "asset_id": row[3],
                    "assigned_at": str(row[4]),
                    "status": row[5],
                    "asset_name": row[6],
                    "plate_number": row[7],
                    "operator_name": row[8]
                }
                for row in rows
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=friendly_error(e))

    finally:
        close_db(conn, cur)