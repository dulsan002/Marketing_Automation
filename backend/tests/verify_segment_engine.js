const { createSegment, calculateMembers, previewCount } = require('../src/modules/segments/segment.service');
const { sequelize } = require('../src/config/database');
const Tenant = require('../src/modules/auth/tenant.model');
const Contact = require('../src/modules/contacts/contact.model');
const Segment = require('../src/modules/segments/segment.model');
const { v4: uuidv4 } = require('uuid');

async function verifySegmentEngine() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Setup Tenant
        const tenant = await Tenant.create({
            name: 'Segment-Test-' + uuidv4(),
            slug: 'seg-test-' + uuidv4(),
            email: 'seg-test-' + uuidv4() + '@example.com',
            password: 'password123'
        });
        console.log('Tenant created:', tenant.id);

        // 2. Seed Contacts
        await Contact.bulkCreate([
            { firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', company: 'Acme', jobTitle: 'CEO', TenantId: tenant.id },
            { firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com', company: 'Beta', jobTitle: 'Dev', TenantId: tenant.id },
            { firstName: 'Charlie', lastName: 'Brown', email: 'charlie@test.com', company: 'Acme', jobTitle: 'CFO', TenantId: tenant.id },
            { firstName: 'David', lastName: 'Wilson', email: 'david@other.com', company: 'Gamma', jobTitle: 'Manager', TenantId: tenant.id }
        ]);
        console.log('Contacts seeded.');

        // 3. Test Preview logic (Stateless)
        // Rule: Email contains 'example.com' (Should calculate 2: Alice, Bob)
        const ruleGroups1 = [{
            condition: 'AND',
            rules: [{ field: 'email', operator: 'contains', value: 'example.com' }]
        }];

        const count1 = await previewCount(ruleGroups1, 'AND', tenant.id);
        console.log(`Preview 1 (Email contains example.com): Expected 2, Got ${count1}`);
        if (count1 !== 2) throw new Error('Preview 1 Failed');

        // Rule: Company equals 'Acme' (Should calculate 2: Alice, Charlie)
        const ruleGroups2 = [{
            condition: 'AND',
            rules: [{ field: 'company', operator: 'equals', value: 'Acme' }]
        }];
        const count2 = await previewCount(ruleGroups2, 'AND', tenant.id);
        console.log(`Preview 2 (Company equals Acme): Expected 2, Got ${count2}`);
        if (count2 !== 2) throw new Error('Preview 2 Failed');

        // 4. Test Create Segment (Stateful)
        const segmentData = {
            name: 'Acme Employees',
            type: 'Dynamic',
            ruleGroups: ruleGroups2
        };

        const segment = await createSegment({ ...segmentData, TenantId: tenant.id });
        console.log('Segment Created:', segment.id);

        if (segment.members !== 2) throw new Error(`Segment Member Count Wrong. Expected 2, Got ${segment.members}`);

        console.log('Segment Engine Verification PASSED');

    } catch (e) {
        console.error('Verification Failed:', e);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

verifySegmentEngine();
