from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_main_db, close_db
from auth_utils import require_role
import re

router = APIRouter()

class AssignmentInput(BaseModel):
    op_id: str
    asset_id: int

class CompleteAssignmentInput(BaseModel):
    assignment_id: int

class UpdateAssignmentNoteInput(BaseModel):
    assignment_id: int
    notes: str

def friendly_error(e: Exception) -> str:
    """Convert raw DB exception to a user-friendly message."""
    msg = str(e)
    # Strip psycopg2 context lines (everything after CONTEXT: or DETAIL:)
    msg = re.split(r'\nCONTEXT:', msg)[0]
    msg = re.split(r'\nDETAIL:', msg)[0]
    # Strip leading error prefix
    msg = re.sub(r'^ERROR:\s*', '', msg.strip())
    # Remove SQLSTATE
    msg = re.sub(r'SQLSTATE\[.*?\]', '', msg).strip()
    return msg or "An unexpected error occurred"


# POST /assignments/create
# only logistics managers (department=logistics) can create assignments
@router.post("/create")
def create_assignment(data: AssignmentInput, user=Depends(require_role(["manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # Verify this manager is logistics department
        cur.execute(
            "SELECT department FROM managers WHERE user_id = %s",
            (user["user_id"],)
        )
        mgr_row = cur.fetchone()
        if not mgr_row or mgr_row[0] != 'logistics':
            raise HTTPException(status_code=403, detail="Only logistics managers can create assignments")

        # Ensure operator is active before assigning
        cur.execute(
            "SELECT active_status FROM operators WHERE op_id = %s",
            (data.op_id,)
        )
        op_row = cur.fetchone()
        if not op_row:
            raise HTTPException(status_code=404, detail="Operator not found")
        if not op_row[0]:
            raise HTTPException(status_code=400, detail="Cannot assign an inactive operator. Activate them first via My Team.")

        cur.execute(
            "SELECT * FROM create_assignment_fn(%s, %s, %s)",
            (user["user_id"], data.op_id, data.asset_id)
        )
        result = cur.fetchone()

        # Auto-set asset to 'scheduled' when assignment is created
        try:
            cur.execute(
                "UPDATE assets SET scheduled_status = 'scheduled' WHERE asset_id = %s",
                (data.asset_id,)
            )
        except Exception:
            pass  # If update_asset_status_fn exists, use that instead

        conn.commit()

        return {
            "message": "Assignment created successfully",
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


# PUT /assignments/complete
# only logistics managers can complete assignments
@router.put("/complete")
def complete_assignment(data: CompleteAssignmentInput, user=Depends(require_role(["manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT department FROM managers WHERE user_id = %s",
            (user["user_id"],)
        )
        mgr_row = cur.fetchone()
        if not mgr_row or mgr_row[0] != 'logistics':
            raise HTTPException(status_code=403, detail="Only logistics managers can complete assignments")

        cur.execute(
            "SELECT complete_assignment_fn(%s, %s)",
            (data.assignment_id, user["user_id"])
        )

        # Auto-reset asset to 'unscheduled' when assignment is completed
        try:
            cur.execute(
                """UPDATE assets SET scheduled_status = 'unscheduled'
                   WHERE asset_id = (SELECT asset_id FROM assignments WHERE assignment_id = %s)""",
                (data.assignment_id,)
            )
        except Exception:
            pass

        conn.commit()

        return {"message": "Assignment marked as completed"}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=friendly_error(e))
    finally:
        close_db(conn, cur)


# PUT /assignments/update-notes
# operator can update notes on their own active assignment
@router.put("/update-notes")
def update_assignment_notes(data: UpdateAssignmentNoteInput, user=Depends(require_role(["operator"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # Get operator's op_id
        cur.execute("SELECT op_id FROM operators WHERE user_id = %s", (user["user_id"],))
        op_row = cur.fetchone()
        if not op_row:
            raise HTTPException(status_code=404, detail="Operator record not found")
        op_id = op_row[0]

        # Verify the assignment belongs to this operator
        cur.execute(
            "SELECT assignment_id, status FROM assignments WHERE assignment_id = %s AND op_id = %s",
            (data.assignment_id, op_id)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Assignment not found or does not belong to you")
        if row[1] not in ('active', 'scheduled'):
            raise HTTPException(status_code=400, detail="Can only update notes on active or scheduled assignments")

        cur.execute(
            "UPDATE assignments SET notes = %s WHERE assignment_id = %s",
            (data.notes, data.assignment_id)
        )
        conn.commit()
        return {"message": "Notes updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=friendly_error(e))
    finally:
        close_db(conn, cur)


# GET /assignments/my
# operator sees only their own assignments
@router.get("/my")
def get_my_assignments(user=Depends(require_role(["operator"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT op_id FROM operators WHERE user_id = %s", (user["user_id"],))
        op_row = cur.fetchone()
        if not op_row:
            return {"assignments": []}
        op_id = op_row[0]

        cur.execute(
            """
            SELECT a.assignment_id, a.manager_id, a.op_id, a.asset_id,
                   a.assigned_at, a.status, ast.asset_name, ast.plate_number,
                   COALESCE(a.notes, '') as notes
            FROM assignments a
            JOIN assets ast ON a.asset_id = ast.asset_id
            WHERE a.op_id = %s
            ORDER BY a.assigned_at DESC
            """,
            (op_id,)
        )
        rows = cur.fetchall()
        return {
            "assignments": [
                {
                    "assignment_id": r[0],
                    "manager_id": r[1],
                    "op_id": r[2],
                    "asset_id": r[3],
                    "assigned_at": str(r[4]),
                    "status": r[5],
                    "asset_name": r[6],
                    "plate_number": r[7],
                    "notes": r[8]
                }
                for r in rows
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=friendly_error(e))
    finally:
        close_db(conn, cur)


# GET /assignments/all
# admins and managers can view all assignments
@router.get("/all")
def get_all_assignments(user=Depends(require_role(["admin", "manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT a.assignment_id, a.manager_id, a.op_id, a.asset_id,
                   a.assigned_at, a.status, ast.asset_name, ast.plate_number,
                   u.name as operator_name,
                   COALESCE(a.notes, '') as notes
            FROM assignments a
            JOIN assets ast ON a.asset_id = ast.asset_id
            JOIN operators op ON a.op_id = op.op_id
            JOIN users u ON op.user_id = u.user_id
            ORDER BY a.assigned_at DESC
        """)
        rows = cur.fetchall()

        return {
            "assignments": [
                {
                    "assignment_id": r[0],
                    "manager_id": r[1],
                    "op_id": r[2],
                    "asset_id": r[3],
                    "assigned_at": str(r[4]),
                    "status": r[5],
                    "asset_name": r[6],
                    "plate_number": r[7],
                    "operator_name": r[8],
                    "notes": r[9]
                }
                for r in rows
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=friendly_error(e))
    finally:
        close_db(conn, cur)
