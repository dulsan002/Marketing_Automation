const { sequelize } = require('../backend/src/config/database');
const Tenant = require('../backend/src/modules/auth/tenant.model');
const Account = require('../backend/src/modules/abm/account.model');
const Contact = require('../backend/src/modules/contacts/contact.model');
// const { faker } = require('@faker-js/faker'); // Optional: if available, otherwise use random

// Data Generators (Simple fallback if faker not present)
const INDUSTRIES = ['Technology', 'Manufacturing', 'Healthcare', 'Finance', 'Retail', 'Energy', 'Telecommunications'];
const COUNTRIES = ['USA', 'UK', 'Germany', 'France', 'Canada', 'Australia', 'Japan', 'Singapore'];
const TIERS = ['Tier 1', 'Tier 2', 'Tier 3'];
const TITLES = ['CEO', 'CTO', 'VP Marketing', 'Director of Sales', 'Manager', 'Analyst', 'Engineer'];

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function seedRobustData() {
    try {
        console.log('🌱 Starting Robust Data Repair & Seeding...');

        // 1. Fetch All Tenants
        const tenants = await Tenant.findAll();
        if (tenants.length === 0) {
            console.log('⚠️ No tenants found.');
            process.exit(0);
        }

        for (const tenant of tenants) {
            console.log(`\nProcessing Tenant: ${tenant.name} (${tenant.id})`);

            // 2. Ensure at least 3 Accounts
            const existingAccounts = await Account.findAll({ where: { TenantId: tenant.id } });
            let accountsToProcess = [...existingAccounts];

            if (existingAccounts.length < 3) {
                const needed = 3 - existingAccounts.length;
                console.log(`   + Creating ${needed} missing accounts...`);
                for (let k = 0; k < needed; k++) {
                    const newAcc = await Account.create({
                        name: `New Account ${Date.now()}_${k}`,
                        domain: `newaccount${Date.now()}_${k}.com`,
                        industry: getRandom(INDUSTRIES),
                        tier: getRandom(TIERS),
                        country: getRandom(COUNTRIES),
                        intentScore: Math.floor(Math.random() * 100),
                        revenue: (Math.random() * 100).toFixed(2),
                        employees: Math.floor(Math.random() * 1000),
                        TenantId: tenant.id
                    });
                    accountsToProcess.push(newAcc);
                }
            }

            // 3. Process ALL Accounts (Repair & Fill Contacts)
            for (const acc of accountsToProcess) {
                // Repair Account Nulls
                let accUpdates = {};
                if (!acc.industry) accUpdates.industry = getRandom(INDUSTRIES);
                if (!acc.tier) accUpdates.tier = getRandom(TIERS);
                if (!acc.country) accUpdates.country = getRandom(COUNTRIES);
                if (!acc.domain) accUpdates.domain = `${acc.name.replace(/\s+/g, '').toLowerCase()}.com`;
                if (acc.intentScore == null) accUpdates.intentScore = 50;

                if (Object.keys(accUpdates).length > 0) {
                    await acc.update(accUpdates);
                    console.log(`   🔧 Repaired Account: ${acc.name}`);
                }

                // Ensure at least 3 Contacts
                const contacts = await Contact.findAll({ where: { AccountId: acc.id } });
                const currentContactCount = contacts.length;

                if (currentContactCount < 3) {
                    const neededContacts = 3 - currentContactCount;
                    console.log(`      + Adding ${neededContacts} contacts for ${acc.name}...`);

                    for (let c = 0; c < neededContacts; c++) {
                        const fName = `User${Date.now()}_${c}`;
                        const lName = `Test`;
                        await Contact.create({
                            firstName: fName,
                            lastName: lName,
                            email: `${fName.toLowerCase()}@${acc.domain || 'example.com'}`,
                            phone: '555-0000',
                            tags: ['Auto-Generated', acc.industry || 'Tech'],
                            engagementScore: Math.floor(Math.random() * 100),
                            intentScore: Math.floor(Math.random() * 100),
                            lastScoredAt: new Date(),
                            AccountId: acc.id,
                            TenantId: tenant.id
                        });
                    }
                }

                // Repair Contact Nulls
                const allContacts = await Contact.findAll({ where: { AccountId: acc.id } });
                for (const contact of allContacts) {
                    let contactUpdates = {};
                    if (!contact.phone) contactUpdates.phone = '555-0000';
                    if (!contact.engagementScore) contactUpdates.engagementScore = 0;

                    if (Object.keys(contactUpdates).length > 0) {
                        await contact.update(contactUpdates);
                    }
                }
            }
        }

        console.log('\n✅ Data Repair & Seeding Complete.');
        process.exit(0);

    } catch (e) {
        console.error('❌ Error:', e);
        process.exit(1);
    }
}

seedRobustData();
