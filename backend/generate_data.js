const { sequelize } = require('./src/config/database');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Import Models
const Tenant = require('./src/modules/tenants/tenant.model');
const User = require('./src/modules/auth/user.model');
const Account = require('./src/modules/abm/account.model');
const Contact = require('./src/modules/contacts/contact.model');
const Event = require('./src/modules/events/event.model');

// Helpers
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const industries = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail'];
const countries = ['USA', 'UK', 'Canada', 'Germany', 'Australia'];
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const domains = ['tech.com', 'fin.org', 'health.net', 'mfg.io', 'shop.co'];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function generateData() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();

        // 1. Ensure Tenant
        let tenant = await Tenant.findOne({ where: { slug: 'demo-corp' } });
        if (!tenant) {
            console.log('Creating Demo Corp tenant...');
            tenant = await Tenant.create({
                name: 'Demo Corp',
                slug: 'demo-corp',
                plan: 'Enterprise',
                modules: JSON.stringify(['MAP', 'ABM', 'Events'])
            });
        }
        console.log(`Using Tenant: ${tenant.name} (${tenant.id})`);

        // 2. Ensure User
        const adminEmail = 'admin@demo-corp.com';
        let user = await User.findOne({ where: { email: adminEmail } });
        if (!user) {
            console.log('Creating Admin User...');
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            user = await User.create({
                email: adminEmail,
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'User',
                role: 'ADMIN',
                tenantId: tenant.id // Ensure camelCase matching model definition if needed, or TenantId
            });
        }
        console.log(`Using User: ${user.email}`);

        // 3. Create 5 Accounts
        console.log('Creating 5 Accounts...');
        for (let i = 0; i < 5; i++) {
            const accName = `${getRandomElement(industries)} Corp ${randomInt(100, 999)}`;
            const account = await Account.create({
                name: accName,
                domain: `${accName.replace(/\s/g, '').toLowerCase()}.com`,
                industry: getRandomElement(industries),
                tier: `Tier ${randomInt(1, 3)}`, // Tier 1, 2, or 3
                country: getRandomElement(countries),
                intentScore: randomInt(10, 90),
                intentSignals: randomInt(0, 50),
                intentTrend: getRandomElement(['Increasing', 'Stable', 'Decreasing']),
                TenantId: tenant.id
            });

            console.log(`  Created Account: ${account.name}`);

            // 4. Create 5 Contacts per Account
            for (let j = 0; j < 5; j++) {
                const fn = getRandomElement(firstNames);
                const ln = getRandomElement(lastNames);
                await Contact.create({
                    firstName: fn,
                    lastName: ln,
                    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${account.domain}`,
                    phone: `555-01${randomInt(10, 99)}`,
                    score: randomInt(0, 100),
                    engagementScore: randomInt(0, 50),
                    TenantId: tenant.id,
                    AccountId: account.id
                });
            }
            console.log(`    -> Added 5 Contacts.`);
        }

        console.log('Data Generation Complete.');

        // 5. Replace Backup
        console.log('Updating Backup (database.sqlite)...');
        const activeDb = path.join(__dirname, 'database_new.sqlite'); // active one
        const backupDb = path.join(__dirname, 'database.sqlite'); // backup one

        // Verify we are copying FROM the one we just wrote to.
        // configuration points to database_new.sqlite (Step 2054)

        fs.copyFileSync(activeDb, backupDb);
        console.log('Backup updated.');

    } catch (e) {
        console.error('Generation Failed:', e);
    } finally {
        await sequelize.close();
    }
}

generateData();
