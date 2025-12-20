const { sequelize } = require('../config/database');
const Segment = require('../modules/segments/segment.model');
const Tenant = require('../modules/tenants/tenant.model');

const run = async () => {
    try {
        await sequelize.sync({ force: true });
        console.log('DB Synced');

        const tenant = await Tenant.create({ name: 'Debug Tenant' });
        console.log('Tenant Created:', tenant.id);

        const ruleGroups = [
            {
                condition: 'AND',
                rules: [{ field: 'email', operator: 'contains', value: '@' }]
            }
        ];

        try {
            const segment = await Segment.create({
                name: 'Debug Segment',
                type: 'Dynamic',
                ruleGroups: ruleGroups,
                TenantId: tenant.id,
                rulesCount: 0,
                members: 100
            });
            console.log('Segment Created:', segment.toJSON());
        } catch (err) {
            console.error('Segment Create Error:', err);
        }

    } catch (error) {
        console.error('General Error:', error);
    } finally {
        await sequelize.close();
    }
};

run();
