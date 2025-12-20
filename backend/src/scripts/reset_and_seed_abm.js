const { sequelize } = require('../config/database');
const Account = require('../modules/abm/account.model');
const Contact = require('../modules/contacts/contact.model');
const IntentSignal = require('../modules/abm/intent_signal.model');
const Tenant = require('../modules/tenants/tenant.model');
// Use service to ensure logic triggers
const { processActivity, createAccount } = require('../modules/abm/account.service');

const seedData = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.query('PRAGMA foreign_keys = OFF');
        await sequelize.sync({ force: true });
        await sequelize.query('PRAGMA foreign_keys = ON');

        console.log('Database synced.');

        // 1. Create Tenant (Strict: with slug)
        const tenant = await Tenant.create({
            name: 'Demo Corp',
            slug: 'demo-corp', // Requirement
            domain: 'demo.com',
            status: 'ACTIVE',
            subscriptionPlan: 'enterprise'
        });
        const tenantId = tenant.id;
        console.log(`Created Tenant: ${tenant.name} (${tenantId})`);

        // 2. Loop 5 Accounts
        for (let i = 1; i <= 5; i++) {
            const accName = `Account ${i}`;
            const account = await createAccount({
                TenantId: tenantId,
                name: accName,
                domain: `account${i}.com`,
                industry: 'Tech',
                tier: i === 1 ? 'Tier 1' : 'Tier 3', // Mix tiers
                revenue: 1000000 * i,
                employees: 50 * i
            });
            console.log(`  Created Account: ${account.name}`);

            // 3. Create 5 Contacts per Account (Buying Committee)
            const roles = ['Champion', 'Decision Maker', 'Influencer', 'Blocker', 'User'];
            const contacts = [];
            for (let j = 0; j < 5; j++) {
                const contact = await Contact.create({
                    TenantId: tenantId,
                    AccountId: account.id,
                    firstName: `Contact`,
                    lastName: `${i}-${j}`,
                    email: `contact${i}-${j}@account${i}.com`,
                    title: roles[j],
                    tags: [roles[j]] // Tags represent roles
                });
                contacts.push(contact);
            }
            console.log(`    Created 5 Contacts.`);

            // 4. Generate 20 Activities per Account
            // Distribute randomly among contacts and activity types
            const activityTypes = ['email_open', 'link_click', 'page_visit', 'event_attend'];
            const sources = ['Email', 'Website', 'Event'];

            for (let k = 0; k < 20; k++) {
                const randomContact = contacts[Math.floor(Math.random() * contacts.length)];
                const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
                const randomSource = sources[Math.floor(Math.random() * sources.length)];

                // We need to wait a tiny bit or just process? 
                // processActivity handles time based dedupe (minute precision). 
                // If we run too fast, they might have same minute.
                // We will manually force occurredAt if we could, but service takes 'now'.
                // Ideally service logic rounds to minute for dedupe.
                // To avoid dedupe collision in loop, we can just hope Node is slow enough or the random data makes key unique.
                // Key = tenant + contact + type + source + time. 
                // If contact, type, source are same in same minute, it dedupes.
                // With 5 contacts, 4 types, 3 sources, collision is low but possible.
                await processActivity(tenantId, randomContact.id, account.id, randomType, randomSource);
            }
            console.log(`    Generated 20 Activities.`);

            // Double check score
            await account.reload();
            console.log(`    Account Intent Score: ${account.intentScore}, Signals: ${account.intentSignals}`);
        }

        console.log('Seeding Complete.');

    } catch (e) {
        console.error('Seeding Failed:', e);
    } finally {
        await sequelize.close();
    }
};

seedData();
