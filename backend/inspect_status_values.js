const { sequelize } = require('./src/config/database');
const Registration = require('./src/modules/events/registration.model');

async function checkStatusValues() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // Fetch all registrations and print their status raw value
        const regs = await Registration.findAll({ attributes: ['id', 'status', 'firstName'] });

        console.log(`Found ${regs.length} registrations.`);
        regs.forEach(r => {
            console.log(`[${r.id}] ${r.firstName}: '${r.status}'`);
        });

    } catch (e) {
        console.error(e);
    }
}

checkStatusValues();
