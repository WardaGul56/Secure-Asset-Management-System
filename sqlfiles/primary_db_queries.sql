--warda queries
--assets.py
-- create asset function
CREATE OR REPLACE FUNCTION create_asset_fn(
    p_asset_name    TEXT,
    p_plate_number  TEXT
)
RETURNS TABLE(fn_asset_id INT, fn_asset_name TEXT, fn_plate_number TEXT) AS $$
DECLARE
    v_asset_id INT;
BEGIN
    -- check duplicate plate
    IF EXISTS (SELECT 1 FROM asset WHERE plate_number = p_plate_number) THEN
        RAISE EXCEPTION 'plate number already exists';
    END IF;

    INSERT INTO asset (asset_name, plate_number)
    VALUES (p_asset_name, p_plate_number)
    RETURNING asset.asset_id INTO v_asset_id;

    fn_asset_id    := v_asset_id;
    fn_asset_name  := p_asset_name;
    fn_plate_number := p_plate_number;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
DROP FUNCTION create_asset_fn(text,text);
--select create_asset_fn('Usman Crane','DD-57');

-- view to list all assets
CREATE OR REPLACE VIEW assets_view AS
SELECT
    asset_id,
    asset_name,
    plate_number,
    scheduled_status
FROM asset
ORDER BY asset_id DESC;
--select * from assets_view;

-- update asset status function
-- raises exceptions for each failure case
-- Python catches them via the generic except block
CREATE OR REPLACE FUNCTION update_asset_status_fn(
    p_asset_id      INT,
    p_new_status    scheduled_status_type,
    p_user_id       INT
)
RETURNS VOID AS $$
DECLARE
    v_department TEXT;
BEGIN
    -- check manager is logistics
    SELECT department INTO v_department
    FROM fleet_manager
    WHERE user_id = p_user_id;

    IF v_department IS NULL OR v_department != 'logistics' THEN
        RAISE EXCEPTION 'only logistics managers can update asset status';
    END IF;

    -- check asset exists
    IF NOT EXISTS (SELECT 1 FROM asset WHERE asset_id = p_asset_id) THEN
        RAISE EXCEPTION 'asset not found';
    END IF;

    UPDATE asset
    SET scheduled_status = p_new_status
    WHERE asset_id = p_asset_id;
END;
$$ LANGUAGE plpgsql;
--drop function update_asset_status_fn(int,text,int);


-- get single asset function
CREATE OR REPLACE FUNCTION get_asset_fn(p_asset_id INT)
RETURNS TABLE(
    asset_id            INT,
    asset_name          TEXT,
    plate_number        TEXT,
    scheduled_status    TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.asset_id,
        a.asset_name::TEXT,
        a.plate_number::TEXT,
        a.scheduled_status::TEXT
    FROM asset a
    WHERE a.asset_id = p_asset_id;
END;
$$ LANGUAGE plpgsql;
--select get_asset_fn(2);


--assignment.py
-- create assignment function
CREATE OR REPLACE FUNCTION create_assignment_fn(
    p_user_id   INT,
    p_op_id     TEXT,
    p_asset_id  INT
)
RETURNS TABLE(assignment_id INT) AS $$
DECLARE
    v_manager_id    TEXT;
    v_department    TEXT;
    v_active_status BOOLEAN;
    v_assignment_id INT;
BEGIN
    -- verify manager is logistics
    SELECT manager_id, department INTO v_manager_id, v_department
    FROM fleet_manager
    WHERE user_id = p_user_id;

    IF v_manager_id IS NULL OR v_department != 'logistics' THEN
        RAISE EXCEPTION 'only logistics managers can create assignments';
    END IF;

    -- check operator exists and is active
    SELECT active_status INTO v_active_status
    FROM operators
    WHERE op_id = p_op_id;

    IF v_active_status IS NULL THEN
        RAISE EXCEPTION 'operator not found';
    END IF;

    IF v_active_status = false THEN
        RAISE EXCEPTION 'operator is not active';
    END IF;

    -- check asset exists
    IF NOT EXISTS (SELECT 1 FROM asset WHERE asset_id = p_asset_id) THEN
        RAISE EXCEPTION 'asset not found';
    END IF;

    -- check operator not already actively assigned
    IF EXISTS (
        SELECT 1 FROM assignments
        WHERE op_id = p_op_id AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'operator already has an active assignment';
    END IF;

    -- create assignment
    INSERT INTO assignments (manager_id, op_id, asset_id, status)
    VALUES (v_manager_id, p_op_id, p_asset_id, 'active')
    RETURNING assignments.assignment_id INTO v_assignment_id;

    assignment_id := v_assignment_id;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;


select create_assignment_fn(2,'op_002',2);


-- complete assignment function
CREATE OR REPLACE FUNCTION complete_assignment_fn(
    p_assignment_id INT,
    p_user_id INT
)
RETURNS VOID AS $$
DECLARE
    v_department TEXT;
    v_asset_id INT;
    v_status TEXT;
BEGIN
    -- check manager role
    SELECT department INTO v_department
    FROM fleet_manager
    WHERE user_id = p_user_id;

    IF v_department IS NULL OR v_department <> 'logistics' THEN
        RAISE EXCEPTION 'only logistics managers can complete assignments';
    END IF;

    -- get assignment + asset
    SELECT asset_id, status
    INTO v_asset_id, v_status
    FROM assignments
    WHERE assignment_id = p_assignment_id;

    IF v_asset_id IS NULL THEN
        RAISE EXCEPTION 'assignment not found';
    END IF;

    IF v_status <> 'active' THEN
        RAISE EXCEPTION 'assignment already completed';
    END IF;

    -- update assignment
    UPDATE assignments
	SET status = 'completed', completed_at = current_timestamp
	WHERE assignment_id = p_assignment_id;

    -- update asset too 
    UPDATE asset
    SET scheduled_status = 'done' --CHANGE IT TO UNSCHEDULED
    WHERE asset_id = v_asset_id;

END;
$$ LANGUAGE plpgsql;

select complete_assignment_fn(2,2);
-- view for all assignments with joins
CREATE OR REPLACE VIEW assignments_view AS
SELECT
    a.assignment_id,
    a.manager_id,
    a.op_id,
    a.asset_id,
    a.assigned_at,
    a.status,
    ast.asset_name,
    ast.plate_number,
    u.name AS operator_name
FROM assignments a
JOIN asset ast ON a.asset_id = ast.asset_id
JOIN operators o ON a.op_id = o.op_id
JOIN users u ON o.user_id = u.user_id
ORDER BY a.assigned_at DESC;

--select * from assignments_view;


--auth.py
--view for login info of user using his username
CREATE OR REPLACE FUNCTION login_user_fn(p_username TEXT)
RETURNS TABLE(
    user_id INT,
    username TEXT,
    role TEXT,
    is_active BOOLEAN,
    pass_hash TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.user_id,
        p.username::text,
        u.role::text,
        u.is_active,
        p.pass_hash::text
    FROM passwords p
    JOIN users u ON p.user_id = u.user_id
    WHERE p.username = login_user_fn.p_username;

END;
$$;

--select * from login_user_fn('Dictator_Kim');

--breaches.py
CREATE OR REPLACE VIEW sqli_breaches_view AS
SELECT
    sb_id,
    attacker_ip,
    malicious_input,
    timestamp,
    session_id
FROM vault_schema.sql_breach
ORDER BY timestamp DESC;

--select * from sqli_breaches_view;


CREATE OR REPLACE VIEW geofence_breaches_view AS
SELECT
    gb_id,
    log_id,
    asset_id,
    zone_id,
    detected_at
FROM vault_schema.geofence_breach
ORDER BY detected_at DESC;

--select * from geofence_breaches_view;



--maheen queries
--honeypot.py


CREATE OR REPLACE VIEW honeypot_assets_view AS
SELECT
    asset_name_fake,
    location_fake
FROM dummy;

--location.py
CREATE OR REPLACE FUNCTION log_location_fn(
    p_asset_id INT,
    p_op_id TEXT,
    p_lat DOUBLE PRECISION,
    p_lon DOUBLE PRECISION
)
RETURNS INT AS $$
DECLARE
    v_log_id INT;
BEGIN

    -- validate operator assignment + active
    IF NOT EXISTS (
        SELECT 1
        FROM assignments
        WHERE op_id = p_op_id
          AND asset_id = p_asset_id
          AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'operator not assigned to asset';
    END IF;

    -- insert location (trigger will handle breach detection)
    INSERT INTO location_logs (asset_id, op_id, current_location)
    VALUES (
        p_asset_id,
        p_op_id,
        ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)
    )
	-- Inside log_location_fn, after the INSERT:
	UPDATE asset
	SET scheduled_status = 'in_progress'
	WHERE asset_id = p_asset_id
	AND scheduled_status = 'scheduled';
    
	RETURNING log_id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

--select log_location_fn(1, 'op_003', 33.7215, 73.0433);

CREATE OR REPLACE VIEW latest_locations_view AS
SELECT DISTINCT ON (ll.asset_id)
    ll.asset_id,
    a.asset_name,
    a.plate_number,
    ll.op_id,
    ST_Y(ll.current_location::geometry) AS latitude,
    ST_X(ll.current_location::geometry) AS longitude,
    ll.time_stamp
FROM location_logs ll
JOIN asset a ON ll.asset_id = a.asset_id
ORDER BY ll.asset_id, ll.time_stamp DESC;
--select * from latest_locations_view;

CREATE OR REPLACE VIEW location_history_view AS
SELECT
    ll.log_id,
    ll.asset_id,
    ll.op_id,
    ST_Y(ll.current_location::geometry) AS latitude,
    ST_X(ll.current_location::geometry) AS longitude,
    ll.time_stamp
FROM location_logs ll;
--select * from location_history_view;

--operators.py

CREATE OR REPLACE VIEW operators_view AS
SELECT
    o.op_id,
    u.name,
    o.username,
    o.manager_id,
    o.active_status
FROM operators o
JOIN users u ON o.user_id = u.user_id
ORDER BY o.op_id;
--select * from operators_view;

CREATE OR REPLACE FUNCTION get_my_operators_fn(p_user_id INT)
RETURNS TABLE (
    op_id varchar(20),
    name varchar(50),
    username VARCHAR(25),
    active_status BOOLEAN
) AS $$
DECLARE
    v_manager_id TEXT;
BEGIN
    -- get manager_id from user_id
    SELECT manager_id INTO v_manager_id
    FROM fleet_manager
    WHERE user_id = p_user_id;

    IF v_manager_id IS NULL THEN
        RAISE EXCEPTION 'manager not found';
    END IF;

    RETURN QUERY
    SELECT
        o.op_id,
        u.name,
        o.username,
        o.active_status
    FROM operators o
    JOIN users u ON o.user_id = u.user_id
    WHERE o.manager_id = v_manager_id
    ORDER BY o.op_id;
END;
$$ LANGUAGE plpgsql;
--drop function get_my_operators_fn(int);
--select get_my_operators_fn(3);

CREATE OR REPLACE FUNCTION toggle_operator_fn(p_op_id TEXT, p_user_id INT)
RETURNS TABLE (
    op_id TEXT,
    active_status BOOLEAN
) AS $$
DECLARE
    v_manager_id TEXT;
    v_current_status BOOLEAN;
BEGIN
    -- get manager
    SELECT manager_id INTO v_manager_id
    FROM fleet_manager
    WHERE user_id = p_user_id;

    IF v_manager_id IS NULL THEN
        RAISE EXCEPTION 'manager not found';
    END IF;

    -- check operator ownership
    SELECT active_status INTO v_current_status
    FROM operators
    WHERE op_id = p_op_id AND manager_id = v_manager_id;

    IF v_current_status IS NULL THEN
        RAISE EXCEPTION 'operator not found or not in your team';
    END IF;

    -- toggle
    UPDATE operators
    SET active_status = NOT v_current_status
    WHERE op_id = p_op_id;

    RETURN QUERY
    SELECT p_op_id, NOT v_current_status;
END;
$$ LANGUAGE plpgsql;
select toggle_operator_fn('op_002', 3);


--users.py

CREATE OR REPLACE FUNCTION create_user_fn(
    p_name TEXT,
    p_email TEXT,
    p_role TEXT,
    p_department TEXT,
    p_manager_id TEXT
)
RETURNS TABLE(username TEXT, user_id INT, default_password TEXT) AS $$
DECLARE
    v_user_id INT;
    v_username TEXT;
    v_count INT;
    v_prefix TEXT;
    v_password TEXT;
BEGIN

    -- check duplicate email
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        RAISE EXCEPTION 'email already exists';
    END IF;

    -- insert base user
    INSERT INTO users (name, email, role, is_active)
    VALUES (p_name, p_email, p_role, true)
    RETURNING users.user_id INTO v_user_id;

    -- decide prefix
    IF p_role = 'admin' THEN
        v_prefix := 'admin';
    ELSIF p_role = 'manager' THEN
        v_prefix := 'manager';
    ELSIF p_role = 'operator' THEN
        v_prefix := 'op';
    ELSE
        RAISE EXCEPTION 'invalid role';
    END IF;

    -- generate username
    SELECT COUNT(*) INTO v_count
    FROM users u
    WHERE u.role = p_role;

    v_username := v_prefix || '_' || LPAD((v_count + 1)::TEXT, 3, '0');

    v_password := v_username;

    -- role-specific inserts
    IF p_role = 'admin' THEN

        INSERT INTO security_admin (admin_id, user_id, username)
        VALUES (v_username, v_user_id, v_username);

    ELSIF p_role = 'manager' THEN

        IF p_department NOT IN ('logistics', 'security_patrol') THEN
            RAISE EXCEPTION 'invalid department';
        END IF;

        INSERT INTO fleet_manager (manager_id, user_id, username, department)
        VALUES (v_username, v_user_id, v_username, p_department);

    ELSIF p_role = 'operator' THEN

        IF NOT EXISTS (SELECT 1 FROM fleet_manager WHERE manager_id = p_manager_id) THEN
            RAISE EXCEPTION 'manager not found';
        END IF;

        INSERT INTO operators (op_id, user_id, username, manager_id, active_status)
        VALUES (v_username, v_user_id, v_username, p_manager_id, false);

    END IF;

    -- password table
    INSERT INTO passwords (username, pass_hash, user_id)
    VALUES (v_username, crypt(v_password, gen_salt('bf')), v_user_id);

    username := v_username;
    user_id := v_user_id;
    default_password := v_password;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION deactivate_user_fn(p_user_id INT)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'user not found';
    END IF;

    IF EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id AND is_active = false) THEN
        RAISE EXCEPTION 'already deactivated';
    END IF;

    UPDATE users
    SET is_active = false
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW users_view AS
SELECT
    user_id,
    name,
    email,
    role,
    joining_date,
    is_active
FROM users
ORDER BY joining_date DESC;
--zones.py

--function to create zone
CREATE OR REPLACE FUNCTION create_zone_fn(
    p_zone_name TEXT,
    p_is_forbidden BOOLEAN,
    p_wkt TEXT,
    p_user_id INT
)
RETURNS INT AS $$
DECLARE
    v_admin_id TEXT;
    v_zone_id INT;
BEGIN
    -- get admin linked to user
    SELECT admin_id INTO v_admin_id
    FROM security_admin
    WHERE user_id = p_user_id;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'admin not found';
    END IF;

    -- insert zone
    INSERT INTO zones (zone_name, boundary, is_forbidden, created_by)
    VALUES (
        p_zone_name,
        ST_GeomFromText(p_wkt, 4326),
        p_is_forbidden,
        v_admin_id
    )
    RETURNING zone_id INTO v_zone_id;

    RETURN v_zone_id;
END;
$$ LANGUAGE plpgsql;

--view to list zones
CREATE OR REPLACE VIEW zones_view AS
SELECT
    zone_id,
    zone_name,
    is_forbidden,
    created_by,
    ST_AsGeoJSON(boundary) AS boundary
FROM zones
ORDER BY zone_id DESC;

--get single zone
CREATE OR REPLACE FUNCTION get_zone_fn(p_zone_id INT)
RETURNS TABLE (
    zone_id INT,
    zone_name TEXT,
    is_forbidden BOOLEAN,
    created_by TEXT,
    boundary TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        z.zone_id,
        z.zone_name,
        z.is_forbidden,
        z.created_by,
        ST_AsGeoJSON(z.boundary)
    FROM zones z
    WHERE z.zone_id = p_zone_id;
END;
$$ LANGUAGE plpgsql;

--delete zone function
CREATE OR REPLACE FUNCTION delete_zone_fn(p_zone_id INT)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM zones WHERE zone_id = p_zone_id) THEN
        RAISE EXCEPTION 'zone not found';
    END IF;

    DELETE FROM zones WHERE zone_id = p_zone_id;
END;
$$ LANGUAGE plpgsql;


-- geofence breach trigger
create or replace function check_geofence_breach()
returns trigger as $$
declare
    breached_zone record;
begin
    select zone_id into breached_zone
    from zones
    where is_forbidden = true
    and st_contains(boundary, new.current_location)
    limit 1;

    if found then
        -- writes to vault db via fdw
        insert into vault_schema.geofence_breach (log_id, asset_id, zone_id, detected_at)
        values (new.log_id, new.asset_id, breached_zone.zone_id, current_timestamp);
    end if;

    return new;
end;
$$ language plpgsql;

create trigger geofence_breach_trigger
after insert on location_logs
for each row
execute function check_geofence_breach();