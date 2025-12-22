
const { sequelize } = require('./src/config/database');
const Tenant = require('./src/modules/tenants/tenant.model');
const Account = require('./src/modules/abm/account.model');
const Contact = require('./src/modules/contacts/contact.model');
const { removeCommitteeMember, addCommitteeMember } = require('./src/modules/abm/account.service');
const fs = require('fs');

const diagnose = async () => {
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync('error_debug.txt', msg + '\n');
    };

    try {
        fs.writeFileSync('error_debug.txt', 'Starting Diagnosis...\n');

        await sequelize.authenticate();
        log('Connected to DB.');

        const tenant = await Tenant.findOne({ where: { slug: 'acme-corp' } });
        const account = await Account.findOne({ where: { TenantId: tenant.id } });

        // 1. Create Contact
        const domain = account.domain || 'test.com';
        const email = `diag_${Date.now()}@${domain}`;
        log(`Creating contact ${email}...`);

        let contact;
        try {
            contact = await Contact.create({
                firstName: 'Diag',
                lastName: 'Nose',
                email: email,
                jobTitle: 'Detective',
                TenantId: tenant.id
            });
            log(`Contact Created: ${contact.id}`);
        } catch (e) {
            log('ERROR at Contact.create: ' + JSON.stringify(e, null, 2));
            throw e;
        }

        // 2. Add to Committee
        log('Adding to committee...');
        try {
            await addCommitteeMember(account.id, tenant.id, { email: email, role: 'Tester' });
            log('Added to committee.');
        } catch (e) {
            log('ERROR at addCommitteeMember: ' + JSON.stringify(e, null, 2));
            throw e;
        }

        // 3. Remove from Committee
        log('Removing from committee...');
        try {
            await removeCommitteeMember(account.id, tenant.id, contact.id);
            log('Removed from committee.');
        } catch (e) {
            log('ERROR at removeCommitteeMember: ' + JSON.stringify(e, null, 2));
            throw e;
        }

        log('SUCCESS: No errors encountered.');

    } catch (e) {
        log('FATAL ERROR CAUGHT:');
        log(e.stack);
        log(JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
    } finally {
        await sequelize.close();
    }
};

diagnose();
