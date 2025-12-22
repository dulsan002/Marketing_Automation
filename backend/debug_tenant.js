const { sequelize } = require('./src/config/database');
const Tenant = require('./src/modules/tenants/tenant.model');
const crypto = require('crypto');

async function test() {
    try {
        console.log('Syncing...');
        await sequelize.sync({ force: true });
        console.log('Sync done.');

        const id = crypto.randomUUID();
        console.log('Creating Tenant', id);
        await Tenant.create({ id, name: 'Debug Tenant' });
        console.log('Success');
    } catch (e) {
        console.error('FAIL:', e);
    }
}
test();
