
const { sequelize } = require('./src/config/database');
const Tenant = require('./src/modules/tenants/tenant.model');
const Segment = require('./src/modules/segments/segment.model');

const seedSegments = async () => {
    const t = await sequelize.transaction();
    try {
        console.log('Connecting...');
        await sequelize.authenticate();

        const tenant = await Tenant.findOne({ where: { slug: 'acme-corp' } });
        if (!tenant) {
            throw new Error('Tenant acme-corp not found. Run seed_dev_data.js first.');
        }

        const segments = [
            {
                name: 'All Leads',
                description: 'Everyone in the database',
                type: 'Dynamic',
                ruleGroups: [], // Empty means all
                members: 105,
                rulesCount: 0,
                TenantId: tenant.id
            },
            {
                name: 'High High Value Prospects',
                description: 'Score > 80',
                type: 'Dynamic',
                ruleGroups: [{ condition: 'AND', rules: [{ field: 'score', operator: 'gt', value: 80 }] }],
                members: 12,
                rulesCount: 1,
                TenantId: tenant.id
            },
            {
                name: 'Recent Signups',
                description: 'Signed up in last 7 days',
                type: 'Dynamic',
                ruleGroups: [{ condition: 'AND', rules: [{ field: 'createdAt', operator: 'gte', value: '7d' }] }],
                members: 5,
                rulesCount: 1,
                TenantId: tenant.id
            }
        ];

        console.log('creating segments...');
        for (const seg of segments) {
            // Check existence by name to avoid duplicates
            const exists = await Segment.findOne({ where: { name: seg.name, TenantId: tenant.id } });
            if (!exists) {
                await Segment.create(seg, { transaction: t });
                console.log(`Created: ${seg.name}`);
            } else {
                console.log(`Skipped (Exists): ${seg.name}`);
            }
        }

        await t.commit();
        console.log('Segment Seeding Complete.');

    } catch (e) {
        await t.rollback();
        console.error('SEED FAILED:', e);
    } finally {
        await sequelize.close();
    }
};

seedSegments();
