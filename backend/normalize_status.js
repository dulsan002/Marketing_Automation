const { sequelize } = require('./src/config/database');
const Registration = require('./src/modules/events/registration.model');
const { Op } = require('sequelize');

async function normalizeStatus() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // 1. Update confirmed -> Registered
        const [updatedConfirmed] = await Registration.update(
            { status: 'Registered' },
            { where: { status: 'confirmed' } }
        );
        console.log(`Updated ${updatedConfirmed} 'confirmed' -> 'Registered'`);

        // 2. Update pending -> Pending
        const [updatedPending] = await Registration.update(
            { status: 'Pending' },
            { where: { status: 'pending' } }
        );
        console.log(`Updated ${updatedPending} 'pending' -> 'Pending'`);

        // 3. Update cancelled -> Cancelled
        const [updatedCancelled] = await Registration.update(
            { status: 'Cancelled' },
            { where: { status: 'cancelled' } }
        );
        console.log(`Updated ${updatedCancelled} 'cancelled' -> 'Cancelled'`);

        // Check remaining
        const remaining = await Registration.findAll({
            attributes: ['id', 'status'],
            group: ['status']
        });
        console.log('Current Status Distribution:', remaining.map(r => r.status));

    } catch (e) {
        console.error(e);
    }
}

normalizeStatus();
