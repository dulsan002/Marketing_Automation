const { clickhouse } = require('../../../config/clickhouse');

/**
 * Service to query behavioral data from ClickHouse.
 * Used by Segment Engine to evaluate rules like "Clicked Email > 2 times".
 */
class BehavioralService {

    /**
     * Check if a contact satisfies a behavioral rule.
     * @param {string} contactId 
     * @param {object} rule { eventType: 'EMAIL_OPENED', operator: 'greater_than', value: 2, windowDays: 7 }
     * @returns {Promise<boolean>}
     */
    async checkCondition(contactId, rule) {
        const { eventType, operator, value, windowDays } = rule;

        // Map abstract eventType to ClickHouse query params
        // Log Table: email_events_log (event_type: 'OPEN', 'CLICK', etc.)
        // Future: web_events_log

        let count = 0;

        try {
            if (['EMAIL_OPENED', 'EMAIL_CLICKED'].includes(eventType)) {
                const dbEventType = eventType === 'EMAIL_OPENED' ? 'OPEN' : 'CLICK';
                const windowClause = windowDays ? `AND timestamp > now() - INTERVAL ${windowDays} DAY` : '';

                const query = `
                    SELECT count(*) as count 
                    FROM email_events_log 
                    WHERE contact_id = {contactId:String} 
                    AND event_type = {dbEventType:String}
                    ${windowClause}
                `;

                const resultSet = await clickhouse.query({
                    query,
                    query_params: {
                        contactId,
                        dbEventType
                    },
                    format: 'JSONEachRow'
                });

                const result = await resultSet.json();
                if (result && result.length > 0) {
                    count = Number(result[0].count);
                }
            } else {
                // Other events not implemented yet
                console.warn(`[BehavioralService] Unsupported event type: ${eventType}`);
                return false;
            }

            console.log(`[BehavioralService] ${contactId} ${eventType} Count: ${count} (Rule: ${operator} ${value})`);

            switch (operator) {
                case 'greater_than': return count > Number(value);
                case 'less_than': return count < Number(value);
                case 'equals': return count == Number(value);
                case 'greater_than_or_equals': return count >= Number(value);
                case 'less_than_or_equals': return count <= Number(value);
                default: return false;
            }

        } catch (err) {
            console.error('[BehavioralService] Query Failed:', err);
            return false; // Fail safe
        }
    }
}

module.exports = new BehavioralService();
