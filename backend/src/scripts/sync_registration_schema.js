const { sequelize } = require('../config/database');
const Registration = require('../modules/events/registration.model');
const Event = require('../modules/events/event.model');
const Contact = require('../modules/contacts/contact.model');

// Ensure associations are loaded
Registration.belongsTo(Event);
Event.hasMany(Registration);
Registration.belongsTo(Contact);
Contact.hasMany(Registration);

const sync = async () => {
    try {
        console.log('Force Syncing Registrations Table...');
        await Registration.sync({ alter: true });
        console.log('Done!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

sync();
