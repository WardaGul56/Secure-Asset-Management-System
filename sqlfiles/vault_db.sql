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

grant usage on schema public to postgres;
grant select on all tables in schema public to postgres;