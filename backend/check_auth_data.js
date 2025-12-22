
const { sequelize } = require('./src/config/database');
const User = require('./src/modules/auth/user.model');
const Tenant = require('./src/modules/tenants/tenant.model');

const fs = require('fs');

const check = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        const tenants = await Tenant.findAll();
        const users = await User.findAll();

        const dump = {
            tenants,
            users
        };

        fs.writeFileSync('db_dump.json', JSON.stringify(dump, null, 2));
        console.log('Dump written to db_dump.json');

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
};

check();
