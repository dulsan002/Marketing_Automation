const { sequelize } = require('./src/config/database');
const Registration = require('./src/modules/events/registration.model');
const Event = require('./src/modules/events/event.model');
const Contact = require('./src/modules/contacts/contact.model');

// Mock tenant ID usually attached by auth middleware
// In this script we'll manually check database for ID or insert one if needed
const TENANT_ID = 'default-tenant-id';

async function reproduce() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');
        console.log('Storage Path:', sequelize.options.storage);
        await sequelize.sync(); // Ensure tables exist


        // 1. Create a Test Event
        const event = await Event.create({
            name: 'Test Event ' + Date.now(),
            type: 'Webinar',
            status: 'Published',
            startDate: new Date(),
            duration: 60,
            TenantId: TENANT_ID
        });
        console.log(`✅ Created Test Event: ${event.id}`);

        // 2. Define Test Data
        const testUser = {
            email: `test_reg_${Date.now()}@example.com`,
            firstName: 'Persistence',
            lastName: 'Check',
            company: 'Data Saved Inc',
            jobTitle: 'Chief Tester'
        };

        console.log('Attempting to register with:', testUser);

        // 3. Direct Service Call
        try {
            console.log('⚠️ Using direct Service call to isolate logic...');
            const eventService = require('./src/modules/events/event.service');
            await eventService.registerManual(event.id, testUser, TENANT_ID);
            console.log('✅ Service execution completed');

        } catch (apiErr) {
            console.error('❌ Service Call Failed:', apiErr);
        }

        // 4. Verification
        // Check Contact
        const contact = await Contact.findOne({ where: { email: testUser.email } });
        console.log('\n--- Verification Results ---');

        if (!contact) {
            console.error('❌ Contact was NOT created!');
        } else {
            console.log('✅ Contact Created:', contact.id);
            console.log(`   Name: ${contact.firstName} ${contact.lastName}`);
            console.log(`   Company: '${contact.company}' (Expected: '${testUser.company}')`);
            console.log(`   JobTitle: '${contact.jobTitle}' (Expected: '${testUser.jobTitle}')`);

            if (contact.company !== testUser.company || contact.jobTitle !== testUser.jobTitle) {
                console.error('❌ DATA LOSS on Contact!');
            }
        }

        // Check Registration
        const registration = await Registration.findOne({
            where: { EventId: event.id, email: testUser.email } // Assuming we save snapshot email
        });

        if (!registration) {
            // Try finding by ContactId
            if (contact) {
                const regByContact = await Registration.findOne({ where: { EventId: event.id, ContactId: contact.id } });
                if (regByContact) {
                    console.log('✅ Registration found via Contact connection.');
                    console.log(`   Snapshot Company: '${regByContact.company}'`);
                    console.log(`   Snapshot JobTitle: '${regByContact.jobTitle}'`);

                    if (regByContact.company !== testUser.company || regByContact.jobTitle !== testUser.jobTitle) {
                        console.error('❌ DATA LOSS on Registration Snapshot!');
                    } else {
                        console.log('✅ Registration Snapshot data preserved.');
                    }
                } else {
                    console.error('❌ Registration NOT found!');
                }
            }
        } else {
            console.log('✅ Registration found.');
        }

    } catch (e) {
        console.error('❌ Script Error:', e);
    } finally {
        // await sequelize.close(); // Keep open if nodemon restarts or similar, but for script close is good
        // process.exit(0);
    }
}

reproduce();
