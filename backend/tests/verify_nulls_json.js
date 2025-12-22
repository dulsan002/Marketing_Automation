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

        const checks = [
            { model: Account, field: 'TenantId', name: 'Account' },
            { model: BanLog, field: 'userEmail', name: 'BanLog' },
            { model: Contact, field: 'TenantId', name: 'Contact' },
            { model: Contact, field: 'AccountId', name: 'Contact' },
            { model: Event, field: 'TenantId', name: 'Event' },
            { model: Registration, field: 'email', name: 'Registration' },
            { model: Segment, field: 'TenantId', name: 'Segment' }
        ];

        const results = [];

        for (const check of checks) {
            const count = await check.model.count({
                where: {
                    [check.field]: { [Op.is]: null }
                }
            });
            results.push({
                table: check.name,
                field: check.field,
                nullRecs: count,
                status: count === 0 ? 'PASS' : 'FAIL'
            });
        }

        console.log(JSON.stringify(results, null, 2));
        process.exit(0);

    } catch (error) {
        console.error(JSON.stringify({ error: error.message }));
        process.exit(1);
    }
};

verifyNulls();
