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