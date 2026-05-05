from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_main_db, close_db
from auth_utils import require_role
import re

router = APIRouter()  #creates a router for assignment

# MODELS
class AssignmentInput(BaseModel):
    op_id: str
    asset_id: int

class CompleteAssignmentInput(BaseModel):
    assignment_id: int


# HELPER FUNCTION
def friendly_error(e: Exception) -> str:  #for cleaner erros msg is stored in e
    msg = str(e)
    msg = re.split(r'\nCONTEXT:', msg)[0]
    msg = re.split(r'\nDETAIL:', msg)[0]
    msg = re.sub(r'^ERROR:\s*', '', msg.strip())
    msg = re.sub(r'SQLSTATE\[.*?\]', '', msg).strip()
    return msg or "An unexpected error occurred"


# CREATE ASSIGNMENT
@router.post("/create")
def create_assignment(data: AssignmentInput, user=Depends(require_role(["manager"]))):
    conn = get_main_db() #db connection
    cur = conn.cursor()  #sql executor

    try:
        # check manager department
        cur.execute(
            "SELECT department FROM fleet_manager WHERE user_id = %s",
            (user["user_id"],)
        )
        mgr = cur.fetchone()

        if not mgr or mgr[0] != "logistics":  #mnager exist but the dept is not logistics
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


# COMPLETE ASSIGNMENT 
@router.put("/complete")
def complete_assignment(data: CompleteAssignmentInput, user=Depends(require_role(["operator"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # get op_id from user_id
        cur.execute(
            "SELECT op_id FROM operators WHERE user_id = %s",
            (user["user_id"],)
        )
        op = cur.fetchone()

        if not op:
            raise HTTPException(status_code=404, detail="Operator not found")

        op_id = op[0]

        # call DB function — ownership + status check is inside
        cur.execute(
            "SELECT complete_assignment_op_fn(%s, %s)",
            (data.assignment_id, op_id)
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


# GET ALL ASSIGNMENTS
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


# GET MY ASSIGNMENTS (OPERATOR)
@router.get("/my")
def get_my_assignments(user=Depends(require_role(["operator"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        #Gets current operator.
        cur.execute("SELECT op_id FROM operators WHERE user_id = %s", (user["user_id"],))
        op = cur.fetchone()

        if not op:
            raise HTTPException(status_code=404, detail="Operator not found")

        cur.execute(
            #Gets only assignments for logged-in operator.
            "SELECT * FROM operator_assignments_view WHERE op_id = %s",
            (op[0],)
        )
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

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=friendly_error(e))

    finally:
        close_db(conn, cur)