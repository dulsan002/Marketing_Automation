const { startExecution, resumeExecution } = require('../modules/workflows/execution.service');
const { redisClient } = require('../config/redis');
const Workflow = require('../modules/workflows/workflow.model');
const WorkflowExecution = require('../modules/workflows/workflow_execution.model');
const { sequelize } = require('../config/database');

describe('Workflow Scheduler (Delays)', () => {
    let tenantId = 't-scheduler';
    let workflowId;

    beforeAll(async () => {
        const { syncDb } = require('./test_helper');
        await syncDb();

        // Create Tenant for FK constraint
        const Tenant = require('../modules/tenants/tenant.model');
        await Tenant.create({ id: tenantId, name: 'Scheduler Tenant', plan: 'Free' });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('1. Start Execution -> Hit WAIT Node -> Pause & Write to Redis', async () => {
        // Create Workflow with WAIT
        const wf = await Workflow.create({
            TenantId: tenantId,
            name: 'Wait WF',
            status: 'active',
            nodes: [
                { id: 'start', type: 'Trigger' },
                { id: 'wait1', type: 'WAIT', data: { duration: 10 } }, // 10 mins
                { id: 'end', type: 'Action' }
            ],
            edges: [
                { source: 'start', target: 'wait1' },
                { source: 'wait1', target: 'end' }
            ]
        });
        workflowId = wf.id;

        const exec = await startExecution(wf.id, tenantId);

        expect(exec.status).toBe('PAUSED');

        // Verify Redis ZADD
        expect(redisClient.zAdd).toHaveBeenCalledTimes(1);
        const args = redisClient.zAdd.mock.calls[0];
        expect(args[0]).toContain('scheduler:workflow:delays'); // key
        expect(args[1].value).toContain(exec.id); // payload has executionId
    });

    test('2. Resume Execution -> Complete Workflow', async () => {
        // Find the execution we just paused
        const exec = await WorkflowExecution.findOne({ where: { WorkflowId: workflowId } });

        // Call resume manually (simulating Consumer)
        const updatedExec = await resumeExecution(exec.id, 'wait1');

        expect(updatedExec.status).toBe('COMPLETED');

        const logs = updatedExec.logs;
        expect(logs.some(l => l.message === 'Workflow Resumed')).toBe(true);
        expect(logs.some(l => l.message.includes('Processed node end'))).toBe(true); // Should process next node
    });
});
