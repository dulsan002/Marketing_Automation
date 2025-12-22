const { sequelize } = require('../src/config/database');
const { Op } = require('sequelize');

// Import Models
const Account = require('../src/modules/abm/account.model');
const BanLog = require('../src/modules/events/ban-log.model');
const Contact = require('../src/modules/contacts/contact.model');
const Event = require('../src/modules/events/event.model');
const Registration = require('../src/modules/events/registration.model');
const Segment = require('../src/modules/segments/segment.model');

const verifyNulls = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB for Verification.');

        const checks = [
            { model: Account, field: 'TenantId', name: 'Account' },
            { model: BanLog, field: 'userEmail', name: 'BanLog' },
            // BanLog TenantId is already non-null in model, but check anyway?
            { model: Contact, field: 'TenantId', name: 'Contact' },
            { model: Contact, field: 'AccountId', name: 'Contact' },
            { model: Event, field: 'TenantId', name: 'Event' },
            { model: Registration, field: 'email', name: 'Registration' },
            { model: Segment, field: 'TenantId', name: 'Segment' }
        ];

        let hasViolations = false;

        for (const check of checks) {
            const count = await check.model.count({
                where: {
                    [check.field]: { [Op.is]: null }
                }
            });

            if (count > 0) {
                console.error(`[VIOLATION] ${check.name} has ${count} records with NULL ${check.field}`);
                hasViolations = true;
            } else {
                console.log(`[PASS] ${check.name}.${check.field} is clean.`);
            }
        }

        if (hasViolations) {
            console.log('\nCannot enforce constraints without fixing data.');
            process.exit(1);
        } else {
            console.log('\nAll checks passed. Safe to enforce constraints.');
            process.exit(0);
        }

    } catch (error) {
        console.error('Verification Error:', error);
        process.exit(1);
    } finally {
        // await sequelize.close(); // Verify script should close? sequelize singleton might stay open? 
        // process.exit handles it.
    }
};

verifyNulls();
