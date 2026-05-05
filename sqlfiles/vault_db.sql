-- Drop and recreate cleanly
DROP TABLE geofence_breach cascade;

CREATE TABLE geofence_breach (
    gb_id        SERIAL,
    log_id       INTEGER   NOT NULL,
    asset_id     INTEGER   NOT NULL,
    zone_id      INTEGER   NOT NULL,
    detected_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
select * from geofence_breach;
-- Run on VaultDatabase:
CREATE OR REPLACE FUNCTION fill_gb_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.gb_id IS NULL THEN
        NEW.gb_id := (SELECT COALESCE(MAX(gb_id), 0) + 1 FROM geofence_breach);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_gb_id
BEFORE INSERT ON geofence_breach
FOR EACH ROW EXECUTE FUNCTION fill_gb_id();

--drop trigger auto_gb_id on geofence_breach;

CREATE TABLE sql_breach (
    sb_id               SERIAL          PRIMARY KEY,
    attacker_ip         VARCHAR(45)     NOT NULL,
    malicious_input     TEXT            NOT NULL,
    time_stamp           TIMESTAMP       NOT NULL DEFAULT NOW(),
    session_id  VARCHAR(100)
);

--queries for vault_db
CREATE OR REPLACE FUNCTION log_sqli_attempt(
    p_ip TEXT,
    p_input TEXT,
    p_session TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO sql_breach(attacker_ip, malicious_input, session_id)
    VALUES (p_ip, p_input, p_session);
END;
$$ LANGUAGE plpgsql;

-- views for admin dashboard
create or replace view sqli_breaches_view as
select sb_id, attacker_ip, malicious_input, time_stamp, session_id
from sql_breach
order by time_stamp desc;

create or replace view geofence_breaches_view as
select gb_id, log_id, asset_id, zone_id, detected_at
from geofence_breach
order by detected_at desc;

-- Step 1: Recreate the trigger function cleanly
CREATE OR REPLACE FUNCTION fill_gb_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.gb_id IS NULL THEN
        NEW.gb_id := (SELECT COALESCE(MAX(gb_id), 0) + 1 FROM public.geofence_breach);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Recreate trigger
DROP TRIGGER IF EXISTS auto_gb_id ON geofence_breach;
CREATE TRIGGER auto_gb_id
BEFORE INSERT ON geofence_breach
FOR EACH ROW EXECUTE FUNCTION fill_gb_id();

-- Step 3: Grant all permissions
GRANT ALL PRIVILEGES ON TABLE geofence_breach TO postgres;
GRANT ALL PRIVILEGES ON TABLE sql_breach TO postgres;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON FUNCTION fill_gb_id() TO postgres;