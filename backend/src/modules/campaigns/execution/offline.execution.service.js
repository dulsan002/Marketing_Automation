const ExecutionService = require('./execution.service');

class OfflineExecutionService extends ExecutionService {
    constructor() {
        super('Offline');
    }
}

module.exports = new OfflineExecutionService();
