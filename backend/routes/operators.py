# routes/operators.py

from fastapi import APIRouter, HTTPException, Depends
from database import get_main_db, close_db
from auth_utils import require_role

router = APIRouter()

# ============================================
# GET /operators/all
# managers and admins can view all operators
# ============================================
@router.get("/all")
def get_all_operators(user=Depends(require_role(["admin", "manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            select o.op_id, u.name, o.username, o.manager_id, o.active_status
            from operators o
            join users u on o.user_id = u.user_id
            order by o.op_id
            """
        )
        rows = cur.fetchall()

        operators_list = [
            {
                "op_id": row[0],
                "name": row[1],
                "username": row[2],
                "manager_id": row[3],
                "active_status": row[4]
            }
            for row in rows
        ]

        return {"operators": operators_list}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)


# ============================================
# GET /operators/my-team
# manager sees only their own operators
# ============================================
@router.get("/my-team")
def get_my_operators(user=Depends(require_role(["manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # get manager_id from token user_id
        cur.execute(
            "select manager_id from fleet_manager where user_id = %s",
            (user["user_id"],)
        )
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="manager not found")
        manager_id = result[0]

        cur.execute(
            """
            select o.op_id, u.name, o.username, o.active_status
            from operators o
            join users u on o.user_id = u.user_id
            where o.manager_id = %s
            order by o.op_id
            """,
            (manager_id,)
        )
        rows = cur.fetchall()

        operators_list = [
            {
                "op_id": row[0],
                "name": row[1],
                "username": row[2],
                "active_status": row[3]
            }
            for row in rows
        ]

        return {"operators": operators_list}

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)


# ============================================
# PUT /operators/toggle-status/{op_id}
# manager toggles operator on/off shift
# ============================================
@router.put("/toggle-status/{op_id}")
def toggle_operator_status(op_id: str, user=Depends(require_role(["manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # get manager_id
        cur.execute(
            "select manager_id from fleet_manager where user_id = %s",
            (user["user_id"],)
        )
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="manager not found")
        manager_id = result[0]

        # check operator exists and belongs to this manager
        cur.execute(
            "select op_id, active_status from operators where op_id = %s and manager_id = %s",
            (op_id, manager_id)
        )
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="operator not found or not in your team")

        # toggle the status
        new_status = not result[1]
        cur.execute(
            "update operators set active_status = %s where op_id = %s",
            (new_status, op_id)
        )
        conn.commit()

        return {
            "message": "operator status updated",
            "op_id": op_id,
            "active_status": new_status
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)