
const { sequelize } = require('./src/config/database');
const Contact = require('./src/modules/contacts/contact.model');

const fixSchema = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        console.log('Attempting to alter table...');
        await Contact.sync({ alter: true });
        console.log('Sync successful.');

    } catch (e) {
        console.error('SYNC FAILED:', e);
    } finally {
        await sequelize.close();
    }
};

fixSchema();
