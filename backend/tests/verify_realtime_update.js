const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const contactService = require('../src/modules/contacts/contact.service');
const segmentService = require('../src/modules/segments/segment.service');
const eventBus = require('../src/common/event_bus');

// Mock Event Bus (to avoid redis connection errors if any)
eventBus.emit = () => { };

// Mock Event Bus (to avoid redis connection errors if any)
eventBus.emit = () => { };

// Use Singleton Sequelize Instance
const { sequelize } = require('../src/config/database');

// Import Models
const Contact = require('../src/modules/contacts/contact.model');
const Segment = require('../src/modules/segments/segment.model');
const Tenant = require('../src/modules/tenants/tenant.model');
const Account = require('../src/modules/abm/account.model');

// Setup Associations
Contact.belongsTo(Tenant);
Segment.belongsTo(Tenant);
Account.belongsTo(Tenant);
// (Add others if needed for strict mode, but loose is fine for this test)

const runTest = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // 0. Create Dummy Tenant
        const tenant = await Tenant.create({
            name: 'Test Tenant',
            slug: `test-${Date.now()}`,
            status: 'ACTIVE'
        });
        const tenantId = tenant.id;
        console.log(`Created Tenant: ${tenantId}`);

        const companyName = 'Manufacturing Corp 160';

        // 1. Get Initial Count
        const initialContactCount = await Contact.count({ where: { company: companyName, TenantId: tenantId } }); // Filter by tenant too
        // Actually, we want to test the EXISTING scenario. But we just created a NEW tenant.
        // The existing 6 contacts belong to some other tenant?
        // Ah, if we use a NEW tenant, count will be 0.
        // We need to use the EXISTING tenant if we want to debug the "7 vs 6" issue.
        // But we don't know the ID.
        // Let's Find One.
        const existingContact = await Contact.findOne();
        const existingTenantId = existingContact ? existingContact.TenantId : tenantId;
        console.log(`Using Tenant ID: ${existingTenantId}`);

        // If we switch to existing tenant, we don't need the new one (unless existing is invalid).

        // FORCE RECALC NOW
        console.log('Forcing preliminary recalculation...');
        await segmentService.recalculateAllSegments(existingTenantId);

        // Check Segment Again
        let segment = await Segment.findOne({ where: { name: 'Manufacturing Corp 160 Employees' } }); // Global search?
        // Ideally filter by tenant
        if (segment) {
            console.log(`Segment (after recalc) Members: ${segment.members}`);
        } else {
            console.log('Segment not found for this tenant.');
            // Create one for THIS tenant
            segment = await segmentService.createSegment({
                name: 'Manufacturing Corp 160 Employees',
                type: 'Dynamic',
                ruleGroups: [{
                    condition: 'AND',
                    rules: [{ field: 'company', operator: 'equals', value: 'Manufacturing Corp 160' }]
                }],
                TenantId: existingTenantId
            });
            console.log(`Created new segment for test. Members: ${segment.members}`);
        }

        const initialCount = await Contact.count({ where: { company: companyName, TenantId: existingTenantId } });
        console.log(`Real DB Count: ${initialCount}`);

        // 3. Create a New Contact
        console.log('Creating new contact...');
        const newContact = await contactService.createContact({
            firstName: 'Test',
            lastName: 'User',
            email: `test.user.${Date.now()}@mfg.com`,
            company: companyName,
            TenantId: existingTenantId
        });
        console.log(`Created Contact: ${newContact.id}`);

        // 4. Wait a moment for async recalculate (it's fired without await in service)
        console.log('Waiting for recalc...');
        await new Promise(r => setTimeout(r, 2000));

        // 5. Check Segment Again
        await segment.reload();
        console.log(`Updated Segment Members: ${segment.members}`);

        if (segment.members === initialCount + 1) {
            console.log('SUCCESS: Segment updated automatically.');
        } else {
            console.log('FAILURE: Segment did not update.');
        }

        // Cleanup
        await newContact.destroy();
        // Recalc again to restore
        await segmentService.recalculateAllSegments(tenantId);
        await segment.reload();
        console.log(`Restored Segment Members: ${segment.members}`);


    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

runTest();
