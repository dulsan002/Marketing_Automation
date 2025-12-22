const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');

// Initialize Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database_new.sqlite'),
    logging: false
});

const Contact = sequelize.define('Contact', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    company: DataTypes.STRING,
    TenantId: DataTypes.STRING
});

const debugCount = async () => {
    try {
        await sequelize.authenticate();

        const companyName = 'Manufacturing Corp 160';

        // 1. Exact Count
        const count = await Contact.count({
            where: {
                company: companyName
            }
        });

        console.log(`\n--- Count for "${companyName}": ${count} ---`);

        // 2. List all to see if there's a typo or whitespace issue
        const contacts = await Contact.findAll({
            where: {
                company: { [Op.like]: `%Manufacturing%` }
            },
            attributes: ['id', 'company', 'email']
        });

        console.log(`\n--- All "Manufacturing" Contacts (${contacts.length}) ---`);
        contacts.forEach(c => {
            const match = c.company === companyName ? "MATCH" : "MISMATCH";
            console.log(`[${match}] "${c.company}" (${c.email})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

debugCount();
