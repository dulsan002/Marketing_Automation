const { sequelize } = require('./src/config/database');
const Contact = require('./src/modules/contacts/contact.model');

async function checkContacts() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        const count = await Contact.count();
        console.log(`📊 Total Contacts in DB: ${count}`);

        if (count > 0) {
            const contacts = await Contact.findAll({ limit: 5 });
            console.log('Sample Contacts:', JSON.stringify(contacts.map(c => ({
                id: c.id,
                name: `${c.firstName} ${c.lastName}`,
                email: c.email,
                tenantId: c.TenantId
            })), null, 2));
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        // process.exit();
    }
}

checkContacts();
