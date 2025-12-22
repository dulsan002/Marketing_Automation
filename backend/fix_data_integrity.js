const { sequelize } = require('./src/config/database');
const { Op } = require('sequelize');

// Import Models
const Contact = require('./src/modules/contacts/contact.model');
const Registration = require('./src/modules/events/registration.model');
const Account = require('./src/modules/abm/account.model');
const Tenant = require('./src/modules/tenants/tenant.model');

const fixData = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB for Remediation.');

        // 1. Fix Contacts (Missing AccountId)
        const badContacts = await Contact.findAll({ where: { AccountId: null } });
        console.log(`Found ${badContacts.length} contacts without Account.`);

        for (const contact of badContacts) {
            if (!contact.company) {
                // No company? Assign to generic "Unassigned" account
                let unassigned = await Account.findOne({ where: { name: 'Unassigned', TenantId: contact.TenantId } });
                if (!unassigned) {
                    unassigned = await Account.create({
                        name: 'Unassigned',
                        TenantId: contact.TenantId
                    });
                }
                await contact.update({ AccountId: unassigned.id });
                console.log(`[Fixed] Contact ${contact.email} -> Unassigned Account`);
                continue;
            }

            // Search by Company Name
            let account = await Account.findOne({
                where: {
                    name: { [Op.like]: contact.company }, // Case-insensitive-ish
                    TenantId: contact.TenantId
                }
            });

            if (account) {
                await contact.update({ AccountId: account.id });
                console.log(`[Fixed] Contact ${contact.email} -> Account "${account.name}"`);
            } else {
                // Create Account
                account = await Account.create({
                    name: contact.company,
                    TenantId: contact.TenantId,
                    domain: contact.email.split('@')[1] || 'unknown.com'
                });
                await contact.update({ AccountId: account.id });
                console.log(`[Created] Account "${account.name}" for Contact ${contact.email}`);
            }
        }

        // 2. Fix Registrations (Missing Email)
        const badRegs = await Registration.findAll({ where: { email: null } });
        console.log(`Found ${badRegs.length} registrations without Email.`);

        for (const reg of badRegs) {
            let email = null;
            if (reg.registrant && typeof reg.registrant === 'object' && reg.registrant.email) {
                email = reg.registrant.email;
            } else if (reg.ContactId) {
                const contact = await Contact.findByPk(reg.ContactId);
                if (contact) email = contact.email;
            }

            if (!email) {
                email = `missing-email-${reg.id.substring(0, 8)}@placeholder.com`;
                console.log(`[Generated] Placeholder email for Reg ${reg.id}: ${email}`);
            } else {
                console.log(`[Fixed] Reg ${reg.id} -> ${email}`);
            }

            await reg.update({ email: email });
        }

        console.log('--- Data Remediation Complete ---');
        process.exit(0);

    } catch (error) {
        console.error('Remediation Error:', error);
        process.exit(1);
    }
};

fixData();
