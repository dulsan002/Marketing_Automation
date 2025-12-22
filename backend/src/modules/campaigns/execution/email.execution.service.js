const ExecutionService = require('./execution.service');

class EmailExecutionService extends ExecutionService {
    constructor() {
        super('Email');
    }

    async execute(campaignVersion, segmentMembers, tenantId) {
        console.log(`[EMAIL_SERVICE] Preparing email blast...`);
        // Specific checks for email content could go here
        return super.execute(campaignVersion, segmentMembers, tenantId);
    }
}

module.exports = new EmailExecutionService();
