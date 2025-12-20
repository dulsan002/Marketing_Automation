const { clickhouse } = require('../../config/clickhouse');

const getCampaignAnalytics = async (req, res) => {
    const campaignId = req.params.id;

    try {
        // Aggregation Query
        const query = `
            SELECT event_type, count() as count 
            FROM email_events_log 
            WHERE metadata LIKE '%"campaign_id":"${campaignId}"%' 
            OR campaign_version_id = '${campaignId}' 
            GROUP BY event_type
        `;

        // Note: In prod, we'd process metadata JSON more cleanly or use a dedicated campaign_id column.
        // For MVP schema, we rely on Version ID or metadata. 
        // Let's assume passed ID is VersionID for simplicity, OR we handle the join/filtering.
        // Simplified for MVP:

        const resultSet = await clickhouse.query({
            query: `SELECT event_type, count() as count FROM email_events_log WHERE campaign_version_id = {id:UUID} GROUP BY event_type`,
            query_params: { id: campaignId },
            format: 'JSONEachRow',
        });

        const rows = await resultSet.json();

        // Transform rows [{event_type: 'OPEN', count: 10}] -> { opened: 10 }
        const metrics = {
            sent: 0,
            bounced: 0,
            opened: 0,
            clicked: 0
        };

        rows.forEach(r => {
            const type = r.event_type.toLowerCase();
            if (metrics.hasOwnProperty(type)) { // sent, opened, clicked
                metrics[type] = parseInt(r.count, 10); // CH returns strings for BigInt often
            } else if (type === 'open') metrics.opened = parseInt(r.count, 10);
            else if (type === 'click') metrics.clicked = parseInt(r.count, 10);
        });

        // Calculate Rates
        const openRate = metrics.sent > 0 ? ((metrics.opened / metrics.sent) * 100).toFixed(1) : 0;
        const clickRate = metrics.sent > 0 ? ((metrics.clicked / metrics.sent) * 100).toFixed(1) : 0;

        res.status(200).json({
            status: 'success',
            data: {
                campaignId,
                ...metrics,
                openRate: parseFloat(openRate),
                clickRate: parseFloat(clickRate),
                timeline: [] // Future: Time series query
            }
        });
    } catch (error) {
        console.error('Analytics Query Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch analytics' });
    }
};

const getAccountAnalytics = async (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            accountId: req.params.id,
            engagementScore: 78,
            trend: 'Rising',
            activeContacts: 4,
            intentSignals: [
                { category: 'Security', score: 85, date: '2025-01-10' }
            ]
        }
    });
};

const getEventAnalytics = async (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            eventId: req.params.id,
            totalRegistrations: 150,
            checkedIn: 120,
            noShows: 30,
            attendanceRate: 80.0
        }
    });
};

module.exports = {
    getCampaignAnalytics,
    getAccountAnalytics,
    getEventAnalytics
};
