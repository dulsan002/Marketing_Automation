const { sequelize } = require('./src/config/database');
const Tenant = require('./src/modules/auth/tenant.model');

async function checkTenants() {
    try {
        await sequelize.authenticate();
        const tenants = await Tenant.findAll();
        console.log(`Found ${tenants.length} tenants:`);
        tenants.forEach(t => console.log(`- ${t.name} (${t.slug})`));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}
checkTenants();
