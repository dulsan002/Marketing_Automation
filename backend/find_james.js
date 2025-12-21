const { sequelize } = require('./src/config/database');
const Registration = require('./src/modules/events/registration.model');
const Contact = require('./src/modules/contacts/contact.model');

async function findJames() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // Find Contact James Miller
        const contacts = await Contact.findAll({
            where: { firstName: 'James', lastName: 'Miller' }
        });

        if (contacts.length === 0) {
            console.log("❌ James Miller not found in Contacts");
        }

        for (const c of contacts) {
            console.log(`Found Contact: ${c.firstName} ${c.lastName} (${c.id})`);

            // Find Registrations for this contact
            const regs = await Registration.findAll({ where: { ContactId: c.id } });
            for (const r of regs) {
                console.log(`REG_ID:   ${r.id}`);
                console.log(`EVENT_ID: ${r.EventId}`);
                console.log(`STATUS:   ${r.status}`);
                console.log('---');
            }
        }

    } catch (e) {
        console.error(e);
    }
}

findJames();
