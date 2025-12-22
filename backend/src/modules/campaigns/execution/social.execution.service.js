const ExecutionService = require('./execution.service');

class SocialExecutionService extends ExecutionService {
    constructor() {
        super('Social Post');
    }
}

module.exports = new SocialExecutionService();
