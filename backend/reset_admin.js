const { sequelize } = require('./src/config/database');
const User = require('./src/modules/auth/user.model');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
    try {
        await sequelize.authenticate();
        const hashedPassword = await bcrypt.hash('Password123!', 10);

        const [updated] = await User.update(
            { password: hashedPassword },
            { where: { email: 'admin@demo-corp.com' } }
        );

        if (updated) {
            console.log('Admin password reset successfully.');
        } else {
            console.log('Admin user not found.');
        }

    } catch (e) {
        console.error('Reset Error:', e);
    } finally {
        process.exit();
    }
}

resetAdmin();
