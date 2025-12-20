const { sequelize } = require('../backend/src/config/database');
const Tenant = require('../backend/src/modules/auth/tenant.model');
const Account = require('../backend/src/modules/abm/account.model');
const Contact = require('../backend/src/modules/contacts/contact.model');

async function verify() {
    try {
        const nova = await Tenant.findOne({ where: { slug: 'nova' } });
        if (!nova) throw new Error('Nova tenant not found');

        const accountCount = await Account.count({ where: { TenantId: nova.id } });
        const contactCount = await Contact.count({ where: { TenantId: nova.id } });

        console.log(`✅ VERIFICATION RESULTS FOR NOVA (${nova.id})`);
        console.log(`----------------------------------------`);
        console.log(`Accounts: ${accountCount} (Expected: >= 5)`);
        console.log(`Contacts: ${contactCount} (Expected: >= 20)`);

        const sampleContacts = await Contact.findAll({
            where: { TenantId: nova.id },
            limit: 3,
            include: [Account]
        });

        console.log(`\nSAMPLE CONTACTS:`);
        sampleContacts.forEach(c => {
            console.log(`- ${c.email} | Tenant: ${c.TenantId} | Account: ${c.Account ? c.Account.name : 'NULL'}`);
            if (!c.AccountId) console.error('  ❌ MISSING ACCOUNT ID!');
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
verify();
