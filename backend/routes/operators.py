# routes/operators.py

from fastapi import APIRouter, HTTPException, Depends
from database import get_main_db, close_db
from auth_utils import require_role

router = APIRouter()

# GET /operators/all
# managers and admins can view all operators
@router.get("/all")
def get_all_operators(user=Depends(require_role(["admin", "manager"]))):

    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT * FROM operators_view")
        rows = cur.fetchall()

        return {
            "operators": [
                {
                    "op_id": r[0],
                    "name": r[1],
                    "username": r[2],
                    "manager_id": r[3],
                    "active_status": r[4]
                }
                for r in rows
            ]
        }

    finally:
        close_db(conn, cur)

# GET /operators/my-team
# manager sees only their own operators
@router.get("/my-team")
def get_my_operators(user=Depends(require_role(["manager"]))):

    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT * FROM get_my_operators_fn(%s)",
            (user["user_id"],)
        )

        rows = cur.fetchall()

        return {
            "operators": [
                {
                    "op_id": r[0],
                    "name": r[1],
                    "username": r[2],
                    "active_status": r[3]
                }
                for r in rows
            ]
        }

    finally:
        close_db(conn, cur)

# PUT /operators/toggle-status/{op_id}
# manager toggles operator on/off shift
@router.put("/toggle-status/{op_id}")
def toggle_operator_status(op_id: str, user=Depends(require_role(["manager"]))):

    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT * FROM toggle_operator_fn(%s, %s)",
            (op_id, user["user_id"])
        )

        result = cur.fetchone()
        conn.commit()

        return {
            "message": "operator status updated",
            "op_id": result[0],
            "active_status": result[1]
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        close_db(conn, cur)