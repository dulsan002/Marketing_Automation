const { sequelize } = require('../config/database');
const Account = require('../modules/abm/account.model');
const Contact = require('../modules/contacts/contact.model');
const accountService = require('../modules/abm/account.service');
const Tenant = require('../modules/auth/tenant.model');

async function verifyRestrictions() {
    try {
        console.log('--- Verifying Buying Committee Restrictions ---');
        await sequelize.sync();

        const tenant = await Tenant.findOne();
        if (!tenant) throw new Error('No tenant found');

        // 1. Setup Accounts
        const accA = await Account.create({ name: 'Account A', domain: 'a.com', TenantId: tenant.id });
        const accB = await Account.create({ name: 'Account B', domain: 'b.com', TenantId: tenant.id });

        // 2. Setup Contact for Account A
        const contactA = await Contact.create({
            firstName: 'Alice',
            lastName: 'A',
            email: 'alice@a.com',
            TenantId: tenant.id,
            AccountId: accA.id
        });

        // 3. Test Case: Add Alice (@a.com, belongs to A) to Account B
        console.log('Test 1: Adding Alice (Account A) to Account B committee...');
        try {
            await accountService.addCommitteeMember(accB.id, tenant.id, { email: 'alice@a.com', role: 'Decision Maker' });
            console.error('FAIL: Alice was added to Account B committee but should have been blocked.');
        } catch (e) {
            console.log(`SUCCESS: Blocked correctly. Error: ${e.message}`);
        }

        // 4. Test Case: Add someone with wrong domain (@c.com) to Account B
        console.log('Test 2: Adding someone with wrong domain (@c.com) to Account B...');
        const contactC = await Contact.create({
            firstName: 'Charlie',
            lastName: 'C',
            email: 'charlie@c.com',
            TenantId: tenant.id
        });

        try {
            await accountService.addCommitteeMember(accB.id, tenant.id, { email: 'charlie@c.com', role: 'Influencer' });
            console.error('FAIL: Charlie (@c.com) was added to Account B but domain should mismatch.');
        } catch (e) {
            console.log(`SUCCESS: Blocked correctly. Error: ${e.message}`);
        }

        // 5. Test Case: Add valid member (@b.com) to Account B
        console.log('Test 3: Adding valid member (@b.com) to Account B...');
        const contactB = await Contact.create({
            firstName: 'Bob',
            lastName: 'B',
            email: 'bob@b.com',
            TenantId: tenant.id
        });

        try {
            await accountService.addCommitteeMember(accB.id, tenant.id, { email: 'bob@b.com', role: 'User' });
            console.log('SUCCESS: Bob added correctly.');
        } catch (e) {
            console.error(`FAIL: Bob should have been added. Error: ${e.message}`);
        }

        console.log('--- Verification Finished ---');
    } catch (error) {
        console.error('Verification script crashed:', error);
    } finally {
        process.exit();
    }
}

verifyRestrictions();
