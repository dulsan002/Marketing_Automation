const ExecutionService = require('./execution.service');

class SMSExecutionService extends ExecutionService {
    constructor() {
        super('SMS');
    }
}

module.exports = new SMSExecutionService();
