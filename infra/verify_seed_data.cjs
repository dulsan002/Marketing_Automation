const { sequelize } = require('../backend/src/config/database');
const { QueryTypes } = require('../backend/node_modules/sequelize');

async function verifySeed() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to Database');

        // 1. Verify Tenants
        console.log('\n--- Tenants ---');
        const tenants = await sequelize.query("SELECT name, slug, id FROM Tenants", { type: QueryTypes.SELECT });
        tenants.forEach(t => console.log(`${t.name} (${t.slug}) - ID: ${t.id}`));

        // 2. Verify Users for 'acme'
        console.log('\n--- Users (Acme) ---');
        const acmeContext = tenants.find(t => t.slug === 'acme');
        if (acmeContext) {
            const users = await sequelize.query(`SELECT email, role FROM Users WHERE tenantId = '${acmeContext.id}'`, { type: QueryTypes.SELECT });
            users.forEach(u => console.log(`${u.email} - ${u.role}`));
        } else {
            console.log('❌ Acme tenant not found');
        }

        // 3. Verify Contacts for 'nova'
        console.log('\n--- Contacts (Nova) ---');
        const novaContext = tenants.find(t => t.slug === 'nova');
        if (novaContext) {
            const contacts = await sequelize.query(`SELECT email FROM Contacts WHERE tenantId = '${novaContext.id}'`, { type: QueryTypes.SELECT });
            contacts.forEach(c => console.log(c.email));
        } else {
            console.log('❌ Nova tenant not found');
        }

        console.log('\n✨ Verification Complete');
        process.exit(0);
    } catch (e) {
        console.error('❌ Verification Failed:', e);
        process.exit(1);
    }
}

verifySeed();
