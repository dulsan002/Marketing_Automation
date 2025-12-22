const ExecutionService = require('./execution.service');

class InAppExecutionService extends ExecutionService {
    constructor() {
        super('In-app');
    }
}

module.exports = new InAppExecutionService();
