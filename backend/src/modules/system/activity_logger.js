const ActivityLog = require('./activity_log.model');

/**
 * Log a system activity.
 * @param {string} tenantId 
 * @param {string|null} actorId 
 * @param {string} entityType 
 * @param {string} entityId 
 * @param {string} action 
 * @param {object} metadata 
 */
const log = async (tenantId, actorId, entityType, entityId, action, metadata = {}) => {
    try {
        await ActivityLog.create({
            TenantId: tenantId,
            actorId,
            entityType,
            entityId,
            action,
            metadata
        });
        // In production, we might want to push this to a queue instead of awaiting DB write
    } catch (error) {
        console.error('Failed to write activity log:', error);
        // Do not throw, logging failure should not break the app
    }
};

module.exports = {
    log
};
