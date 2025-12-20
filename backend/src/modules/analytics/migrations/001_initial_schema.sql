CREATE TABLE IF NOT EXISTS campaign_lifecycle_log (
    tenant_id String,
    timestamp DateTime,
    entity_id UUID,
    event_type String,
    metadata String
) ENGINE = MergeTree()
ORDER BY (tenant_id, timestamp);

CREATE TABLE IF NOT EXISTS email_events_log (
    tenant_id String,
    timestamp DateTime,
    campaign_version_id UUID,
    contact_id UUID,
    event_type String,
    metadata String
) ENGINE = MergeTree()
ORDER BY (tenant_id, timestamp);
