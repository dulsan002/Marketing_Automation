const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false
});

const Tenant = sequelize.define('Tenant', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING, unique: true },
    status: { type: DataTypes.ENUM('ACTIVE', 'SUSPENDED'), defaultValue: 'ACTIVE' }
}, { timestamps: true }); // simplified

const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('ADMIN', 'MARKETER', 'ANALYST'), defaultValue: 'MARKETER' },
    status: { type: DataTypes.ENUM('active', 'inactive', 'suspended'), defaultValue: 'active' },
    tenantId: { type: DataTypes.UUID, allowNull: false }
}, { timestamps: true, tableName: 'Users' });

async function createAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // Find Tenant
        const tenant = await Tenant.findOne({ where: { status: 'ACTIVE' } });
        if (!tenant) {
            console.error('No active tenant found.');
            return;
        }

        const email = `admin@${tenant.slug || 'demo'}.com`;
        const passwordHash = await bcrypt.hash('Password123!', 10);

        const [user, created] = await User.findOrCreate({
            where: { email },
            defaults: {
                password: passwordHash,
                role: 'ADMIN',
                status: 'active',
                tenantId: tenant.id
            }
        });

        console.log(`Admin User: ${email} (${created ? 'Created' : 'Exists'})`);
        console.log('Password: Password123!');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sequelize.close();
    }
}

createAdmin();
