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

@router.post("/create")
def create_assignment(data: AssignmentInput, user=Depends(require_role(["manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # verify this manager is logistics
        cur.execute(
            "select manager_id, department from fleet_manager where user_id = %s",
            (user["user_id"],)
        )
        result = cur.fetchone()
        if not result or result[1] != "logistics":
            raise HTTPException(status_code=403, detail="only logistics managers can create assignments")
        manager_id = result[0]

        # check operator exists and is active
        cur.execute(
            "select op_id, active_status from operators where op_id = %s",
            (data.op_id,)
        )
        op = cur.fetchone()
        if not op:
            raise HTTPException(status_code=404, detail="operator not found")
        if not op[1]:
            raise HTTPException(status_code=400, detail="operator is not active")

        # check asset exists
        cur.execute(
            "select asset_id from asset where asset_id = %s",
            (data.asset_id,)
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="asset not found")

        # check asset not already actively assigned
        cur.execute(
            """
            select assignment_id from assignment
            where asset_id = %s and status = 'active'
            """,
            (data.asset_id,)
        )
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="asset is already actively assigned")

        # check operator not already actively assigned
        cur.execute(
            """
            select assignment_id from assignment
            where op_id = %s and status = 'active'
            """,
            (data.op_id,)
        )
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="operator already has an active assignment")

        # create assignment
        cur.execute(
            """
            insert into assignment (manager_id, op_id, asset_id, status)
            values (%s, %s, %s, 'active')
            returning assignment_id
            """,
            (manager_id, data.op_id, data.asset_id)
        )
        assignment_id = cur.fetchone()[0]
        conn.commit()

        return {
            "message": "assignment created successfully",
            "assignment_id": assignment_id,
            "op_id": data.op_id,
            "asset_id": data.asset_id
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)

# logistics manager marks assignment as done
@router.put("/complete")
def complete_assignment(data: CompleteAssignmentInput, user=Depends(require_role(["manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        # verify logistics manager
        cur.execute(
            "select department from fleet_manager where user_id = %s",
            (user["user_id"],)
        )
        result = cur.fetchone()
        if not result or result[0] != "logistics":
            raise HTTPException(status_code=403, detail="only logistics managers can complete assignments")

        # check assignment exists and is active
        cur.execute(
            "select assignment_id, status from assignment where assignment_id = %s",
            (data.assignment_id,)
        )
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="assignment not found")
        if result[1] != "active":
            raise HTTPException(status_code=400, detail="assignment is already completed")

        cur.execute(
            "update assignment set status = 'completed' where assignment_id = %s",
            (data.assignment_id,)
        )
        conn.commit()

        return {"message": "assignment marked as completed"}

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)

# admins and managers view all assignments
@router.get("/all")
def get_all_assignments(user=Depends(require_role(["admin", "manager"]))):
    conn = get_main_db()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            select a.assignment_id, a.manager_id, a.op_id, a.asset_id,
                   a.assigned_at, a.status,
                   ast.asset_name, ast.plate_number,
                   u.name as operator_name
            from assignment a
            join asset ast on a.asset_id = ast.asset_id
            join operators o on a.op_id = o.op_id
            join users u on o.user_id = u.user_id
            order by a.assigned_at desc
            """
        )
        rows = cur.fetchall()

        assignments_list = [
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

        return {"assignments": assignments_list}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"server error: {e}")

    finally:
        close_db(conn, cur)