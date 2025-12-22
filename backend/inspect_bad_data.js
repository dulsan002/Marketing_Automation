const { sequelize } = require('./src/config/database');
const { Op } = require('sequelize');

// Import Models
const Contact = require('./src/modules/contacts/contact.model');
const Registration = require('./src/modules/events/registration.model');
const Account = require('./src/modules/abm/account.model');
const Tenant = require('./src/modules/tenants/tenant.model'); // Ensure Tenant loaded

const inspect = async () => {
    try {
        await sequelize.authenticate();
        console.log('--- Inspecting Null Contacts ---');

        const badContacts = await Contact.findAll({
            where: { AccountId: null },
            attributes: ['id', 'firstName', 'lastName', 'company', 'email', 'TenantId']
        });

        console.log(`Found ${badContacts.length} contacts without Account.`);
        badContacts.forEach(c => {
            console.log(`[Contact] ${c.email} | Company: ${c.company} | Tenant: ${c.TenantId}`);
        });

        console.log('\n--- Inspecting Null Registrations ---');
        const badRegs = await Registration.findAll({
            where: { email: null },
            attributes: ['id', 'registrant', 'firstName', 'lastName', 'EventId']
        });

        console.log(`Found ${badRegs.length} registrations without Email column.`);
        badRegs.forEach(r => {
            let jsonEmail = 'N/A';
            if (r.registrant && typeof r.registrant === 'object') {
                jsonEmail = r.registrant.email || 'Missing in JSON';
            }
            console.log(`[Registration] ID: ${r.id} | Name: ${r.firstName} ${r.lastName} | JSON Email: ${jsonEmail}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // process.exit(0); 
    }
};

inspect();
