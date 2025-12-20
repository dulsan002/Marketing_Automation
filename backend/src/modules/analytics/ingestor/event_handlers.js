const { clickhouse } = require('../../../config/clickhouse');

// In-memory buffer for batching
const BATCH_SIZE = 100;
const FLUSH_INTERVAL_MS = 5000;
let campaignBuffer = [];
let emailBuffer = [];
let flushTimer = null;

const flushBatch = async () => {
    if (campaignBuffer.length > 0) {
        const rows = [...campaignBuffer];
        campaignBuffer = [];
        try {
            await clickhouse.insert({
                table: 'campaign_lifecycle_log',
                values: rows,
                format: 'JSONEachRow',
            });
            console.log(`[Analytics] Flushed ${rows.length} campaign events`);
        } catch (err) {
            console.error('[Analytics] Failed to flush campaign events:', err.message);
            // In prod: Retry or DLQ
        }
    }

    if (emailBuffer.length > 0) {
        const rows = [...emailBuffer];
        emailBuffer = [];
        try {
            await clickhouse.insert({
                table: 'email_events_log',
                values: rows,
                format: 'JSONEachRow',
            });
            console.log(`[Analytics] Flushed ${rows.length} email events`);
        } catch (err) {
            console.error('[Analytics] Failed to flush email events:', err.message);
        }
    }

    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = null;
};

const scheduleFlush = () => {
    if (!flushTimer) {
        flushTimer = setTimeout(flushBatch, FLUSH_INTERVAL_MS);
    }
    if (campaignBuffer.length >= BATCH_SIZE || emailBuffer.length >= BATCH_SIZE) {
        flushBatch();
    }
};

const handleCampaignLifecycle = (event, eventData) => {
    // Transform flat event to ClickHouse schema
    campaignBuffer.push({
        tenant_id: eventData.tenant_id,
        timestamp: eventData.timestamp || new Date().toISOString(), // CH prefers 'YYYY-MM-DD HH:mm:ss' or ISO
        entity_id: eventData.entity_id,
        event_type: eventData.event_type,
        metadata: JSON.stringify(eventData.metadata || {})
    });
    scheduleFlush();
};

const handleEmailEvent = (event, eventData) => {
    emailBuffer.push({
        tenant_id: eventData.tenant_id,
        timestamp: eventData.timestamp,
        campaign_version_id: eventData.campaign_version_id,
        contact_id: eventData.contact_id,
        event_type: eventData.event_type,
        metadata: JSON.stringify(eventData.metadata || {})
    });
    scheduleFlush();
};

module.exports = {
    handleCampaignLifecycle,
    handleEmailEvent,
    flushBatch // Exported for testing/shutdown
};
