const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');

// Connect to database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database_new.sqlite'),
    logging: false
});

const Contact = sequelize.define('Contact', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    company: DataTypes.STRING,
    TenantId: DataTypes.UUID
});

async function debugCompany() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // 1. Find ANY contacts with "Manufacturing" in company name
        const looseMatches = await Contact.findAll({
            where: {
                company: { [Op.like]: '%Manufacturing%' }
            },
            attributes: ['id', 'firstName', 'lastName', 'email', 'company']
        });

        console.log(`\n--- Loose Search for "Manufacturing" found ${looseMatches.length} contacts ---`);
        looseMatches.forEach(c => console.log(`[${c.company}] - ${c.email}`));

        // 2. Try Exact Match for "Manufacturing Corp 160"
        const exactMatches = await Contact.findAll({
            where: {
                company: 'Manufacturing Corp 160'
            }
        });

        console.log(`\n--- Exact Match for "Manufacturing Corp 160" found ${exactMatches.length} contacts ---`);

        // 3. List all distinct companies to see what surrounds it
        const allCompanies = await Contact.findAll({
            attributes: ['company'],
            group: ['company']
        });
        console.log(`\n--- ALL Available Companies (${allCompanies.length}) ---`);
        allCompanies.forEach(c => console.log(`"${c.company}"`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

debugCompany();
