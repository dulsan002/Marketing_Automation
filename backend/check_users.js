const { sequelize } = require('./src/config/database');
const User = require('./src/modules/auth/user.model');

async function checkUsers() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll();
        console.log(`Found ${users.length} users:`);
        users.forEach(u => console.log(`- ${u.email} (${u.role})`));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}
checkUsers();
