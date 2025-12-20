const { handleCampaignLifecycle, handleEmailEvent, flushBatch } = require('../modules/analytics/ingestor/event_handlers');
const { clickhouse } = require('../config/clickhouse');

describe('Analytics Ingestor', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('1. Campaign Lifecycle Event -> Batched -> ClickHouse Insert', async () => {
        const eventData = {
            tenant_id: 't1',
            entity_id: 'c1',
            event_type: 'ACTIVATED',
            metadata: { version: 1 }
        };

        handleCampaignLifecycle(null, eventData);

        // Force flush
        await flushBatch();

        expect(clickhouse.insert).toHaveBeenCalledTimes(1);
        expect(clickhouse.insert).toHaveBeenCalledWith(expect.objectContaining({
            table: 'campaign_lifecycle_log',
            format: 'JSONEachRow'
        }));

        const insertedRows = clickhouse.insert.mock.calls[0][0].values;
        expect(insertedRows.length).toBe(1);
        expect(insertedRows[0].entity_id).toBe('c1');
    });

    test('2. Email Event -> Batched -> ClickHouse Insert', async () => {
        const eventData = {
            tenant_id: 't1',
            campaign_version_id: 'cv1',
            contact_id: 'con1',
            event_type: 'OPEN',
            timestamp: new Date().toISOString()
        };

        handleEmailEvent(null, eventData);

        await flushBatch();

        expect(clickhouse.insert).toHaveBeenCalledTimes(1);
        expect(clickhouse.insert).toHaveBeenCalledWith(expect.objectContaining({
            table: 'email_events_log'
        }));
    });
});
