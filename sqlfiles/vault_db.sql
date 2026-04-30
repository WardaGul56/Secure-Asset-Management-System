CREATE TABLE geofence_breach (
    gb_id           SERIAL          PRIMARY KEY,
    log_id          INTEGER         NOT NULL,
    asset_id        VARCHAR(50)     NOT NULL,
    zone_id         VARCHAR(50)     NOT NULL,
    detected_at     TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE sql_breach (
    sb_id               SERIAL          PRIMARY KEY,
    attacker_ip         VARCHAR(45)     NOT NULL,
    malicious_input     TEXT            NOT NULL,
    timestamp           TIMESTAMP       NOT NULL DEFAULT NOW(),
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

CREATE OR REPLACE VIEW honeypot_assets_view AS
SELECT
    asset_name_fake,
    location_fake
FROM dummy;

-- views for admin dashboard
create or replace view sqli_breaches_view as
select sb_id, attacker_ip, malicious_input, timestamp, session_id
from sql_breach
order by timestamp desc;

create or replace view geofence_breaches_view as
select gb_id, log_id, asset_id, zone_id, detected_at
from geofence_breach
order by detected_at desc;