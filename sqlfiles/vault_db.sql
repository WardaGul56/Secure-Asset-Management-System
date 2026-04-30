CREATE TABLE geofence_breach (
    gb_id           SERIAL          PRIMARY KEY,
    log_id          INTEGER         NOT NULL,
    asset_id        VARCHAR(50)     NOT NULL,
    zone_id         VARCHAR(50)     NOT NULL,
    detected_at     TIMESTAMP       NOT NULL DEFAULT NOW(),
);

CREATE TABLE sql_breach (
    sb_id               SERIAL          PRIMARY KEY,
    attacker_ip         VARCHAR(45)     NOT NULL,
    malicious_input     TEXT            NOT NULL,
    timestamp           TIMESTAMP       NOT NULL DEFAULT NOW(),
    session_id  VARCHAR(100)
);