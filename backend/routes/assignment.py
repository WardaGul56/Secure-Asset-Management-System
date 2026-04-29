from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_main_db, close_db
from auth_utils import require_role

router = APIRouter()

class AssignmentInput(BaseModel):
    op_id: str
    asset_id: int

class CompleteAssignmentInput(BaseModel):
    assignment_id: int


# POST /assignments/create
# only logistics managers can create assignments
@router.post("/create")
def create_assignment(data: AssignmentInput, user=Depends(require_role(["manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
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

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)


# PUT /assignments/complete
# only logistics managers can complete assignments
@router.put("/complete")
def complete_assignment(data: CompleteAssignmentInput, user=Depends(require_role(["manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT complete_assignment_fn(%s, %s)",
            (data.assignment_id, user["user_id"])
        )
        conn.commit()

        return {"message": "assignment marked as completed"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)


# GET /assignments/all
# admins and managers can view all assignments
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
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)