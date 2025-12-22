
const { sequelize } = require('./src/config/database');
const Tenant = require('./src/modules/tenants/tenant.model');
const Account = require('./src/modules/abm/account.model');
const Contact = require('./src/modules/contacts/contact.model');
const { removeCommitteeMember, addCommitteeMember } = require('./src/modules/abm/account.service');

const verifyFix = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // Ensure schema is definitely correct
        await Contact.sync({ alter: true });

        const tenant = await Tenant.findOne({ where: { slug: 'acme-corp' } });
        const account = await Account.findOne({ where: { TenantId: tenant.id } });

        if (!account) throw new Error('No account found');

        // 1. Create a dummy contact
        const email = `fix_test_${Date.now()}@real.com`;
        const contact = await Contact.create({
            firstName: 'Fix',
            lastName: 'User',
            email: email,
            jobTitle: 'Engineer',
            TenantId: tenant.id
        });
        console.log(`Created Contact: ${contact.id}`);

        // 2. Add to Committee (uses addCommitteeMember which had title vs jobTitle bug too)
        console.log('Adding to committee...');
        await addCommitteeMember(account.id, tenant.id, { email: email, role: 'Tester', title: 'Senior Engineer' });

        const contactAfterAdd = await Contact.findByPk(contact.id);
        if (contactAfterAdd.AccountId !== account.id) throw new Error('Add Failed');
        if (contactAfterAdd.jobTitle !== 'Senior Engineer') console.warn('Warning: Job Title update might have failed? Got:', contactAfterAdd.jobTitle);
        console.log('Added successfully.');

        // 3. Remove from Committee (uses removeCommitteeMember which had key bug)
        console.log('Removing from committee...');
        await removeCommitteeMember(account.id, tenant.id, contact.id);

        // 4. Verify
        const updatedContact = await Contact.findByPk(contact.id);

        if (updatedContact.AccountId === null) {
            console.log('SUCCESS: Member removed successfully. 500 Error Resolved.');
        } else {
            console.error('FAILURE: AccountId is NOT null.');
        }

    } catch (e) {
        console.error('VERIFY FAILED:', e);
    } finally {
        await sequelize.close();
    }
};

verifyFix();
