--warda queries
--assets.py
--assignment.py
--auth.py
--breaches.py
--maheen queries
--honeypot.py
--location.py
--operators.py
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