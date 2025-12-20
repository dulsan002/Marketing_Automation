const { sequelize } = require('./src/config/database');
const User = require('./src/modules/auth/user.model');
const Tenant = require('./src/modules/auth/tenant.model');
const Event = require('./src/modules/events/event.model');
const Contact = require('./src/modules/contacts/contact.model');
const Registration = require('./src/modules/events/registration.model');
const Account = require('./src/modules/abm/account.model');

const check = async () => {
    try {
        await sequelize.authenticate();
        console.log('Use Table:', await User.count());
        console.log('Tenant Table:', await Tenant.count());
        console.log('Event Table:', await Event.count());
        console.log('Contact Table:', await Contact.count());
        console.log('Registration Table:', await Registration.count());
        console.log('Account Table:', await Account.count());
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

check();
