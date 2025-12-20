const { startExecution } = require('../backend/src/modules/workflows/execution.service');
const Workflow = require('../backend/src/modules/workflows/workflow.model');
const WorkflowExecution = require('../backend/src/modules/workflows/workflow_execution.model');
const { sequelize } = require('../backend/src/config/database');
const { redisClient } = require('../backend/src/config/redis');

// Mock Redis manually since we are outside Jest
redisClient.zAdd = async (key, item) => {
    console.log(`[MOCK REDIS] zAdd to ${key}:`, item);
};

const run = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ force: true });

        console.log('DB Synced');

        const wf = await Workflow.create({
            TenantId: 't1',
            name: 'Debug WF',
            status: 'active',
            nodes: JSON.stringify([
                { id: 'start', type: 'Trigger' },
                { id: 'wait1', type: 'WAIT', data: { duration: 10 } },
                { id: 'end', type: 'Action' }
            ]),
            edges: JSON.stringify([
                { source: 'start', target: 'wait1' },
                { source: 'wait1', target: 'end' }
            ])
        });

        console.log('Workflow Created');

        const exec = await startExecution(wf.id, 't1');
        console.log('Execution Finished. Status:', exec.status);
        console.log('Logs:', JSON.stringify(exec.logs, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sequelize.close();
    }
};

run();
