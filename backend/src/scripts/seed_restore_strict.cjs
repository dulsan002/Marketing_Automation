const { Sequelize, DataTypes, QueryTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Database Connection
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false
});

// Models (Simplified Definition for Seeding to avoid path issues)
const Tenant = sequelize.define('Tenant', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, unique: true },
    domain: DataTypes.STRING,
    status: { type: DataTypes.ENUM('ACTIVE', 'SUSPENDED'), defaultValue: 'ACTIVE' },
    subscriptionPlan: { type: DataTypes.ENUM('free', 'pro', 'enterprise'), defaultValue: 'free' }
}, { timestamps: true, paranoid: true });

const Account = sequelize.define('Account', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: DataTypes.STRING,
    domain: DataTypes.STRING,
    industry: DataTypes.STRING,
    tier: DataTypes.ENUM('Tier 1', 'Tier 2', 'Tier 3'),
    country: DataTypes.STRING,
    intentScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    intentSignals: { type: DataTypes.INTEGER, defaultValue: 0 }, // THE FIX
    intentTrend: DataTypes.ENUM('Increasing', 'Stable', 'Decreasing'),
    intentSources: DataTypes.JSON,
    revenue: DataTypes.DECIMAL,
    employees: DataTypes.INTEGER
}, { timestamps: true });

const Contact = sequelize.define('Contact', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    score: { type: DataTypes.INTEGER, defaultValue: 0 }, // THE FIX
    intentScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    engagementScore: DataTypes.INTEGER,
    tags: DataTypes.JSON,
    title: DataTypes.STRING
}, { timestamps: true });

const IntentSignal = sequelize.define('IntentSignal', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    activityType: DataTypes.STRING,
    source: DataTypes.STRING,
    occurredAt: DataTypes.DATE,
    dedupeKey: DataTypes.STRING,
    rawPayload: DataTypes.JSON
}, { timestamps: true });

// Associations
Tenant.hasMany(Account); Account.belongsTo(Tenant);
Tenant.hasMany(Contact); Contact.belongsTo(Tenant);
Account.hasMany(Contact); Contact.belongsTo(Account);
Account.hasMany(IntentSignal); IntentSignal.belongsTo(Account);
Contact.hasMany(IntentSignal); IntentSignal.belongsTo(Contact);

// Logic
const ENGAGEMENT_WEIGHTS = {
    'email_open': 2,
    'link_click': 5,
    'page_visit': 1,
    'event_attend': 10
};

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // Sync (Schema already set by previous force sync, avoid alter collision with backup table)
        await sequelize.sync({ force: false });

        // 1. Restore Tenants
        console.log('Attempting Restore from Tenants_backup...');
        let tenants = [];
        try {
            // Check if table exists first to avoid error spam
            const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='Tenants_backup'");
            if (results.length > 0) {
                const backups = await sequelize.query("SELECT * FROM Tenants_backup", { type: QueryTypes.SELECT });
                if (backups.length > 0) {
                    console.log(`Found ${backups.length} tenants in backup.`);
                    for (const b of backups) {
                        const [t] = await Tenant.findOrCreate({
                            where: { id: b.id },
                            defaults: {
                                name: b.name,
                                slug: b.slug,
                                domain: b.domain,
                                status: b.status,
                                subscriptionPlan: b.subscriptionPlan
                            }
                        });
                        tenants.push(t);
                    }
                }
            } else {
                console.log('Tenants_backup table does not exist. Skipping restore.');
            }
        } catch (e) {
            console.warn('Backup restore skipped due to error (ignoring):', e.message);
        }

        if (tenants.length === 0) {
            console.log('Creating Default Tenant.');
            const [t] = await Tenant.findOrCreate({
                where: { slug: 'demo-corp' },
                defaults: { name: 'Demo Corp', domain: 'demo.com', status: 'ACTIVE', subscriptionPlan: 'enterprise' }
            });
            tenants.push(t);
        }

        // 2. Ensure Data Volume per Tenant
        for (const tenant of tenants) {
            console.log(`Processing Tenant: ${tenant.name}`);

            // Ensure 5 Accounts
            const existingAccounts = await Account.findAll({ where: { TenantId: tenant.id } });
            let accountCount = existingAccounts.length;
            const accounts = [...existingAccounts];

            for (let i = accountCount + 1; i <= 5; i++) {
                const acc = await Account.create({
                    TenantId: tenant.id,
                    name: `Account ${i}`,
                    domain: `account${i}.com`,
                    industry: 'Tech',
                    tier: i === 1 ? 'Tier 1' : 'Tier 3',
                    revenue: 1000000 * i,
                    employees: 50 * i,
                    intentScore: 0,
                    intentSignals: 0
                });
                accounts.push(acc);
                console.log(`  Created Account: ${acc.name}`);
            }

            // Ensure 5 Contacts per Account & Buying Committee
            const roles = ['Champion', 'Decision Maker', 'Influencer', 'Blocker', 'User'];

            for (const account of accounts) {
                const contactCount = await Contact.count({ where: { AccountId: account.id } });
                let currentContacts = await Contact.findAll({ where: { AccountId: account.id } });

                if (contactCount < 5) {
                    for (let j = contactCount; j < 5; j++) {
                        const c = await Contact.create({
                            TenantId: tenant.id,
                            AccountId: account.id,
                            firstName: `Contact`,
                            lastName: `${j}`,
                            email: `contact${j}@${account.domain || 'test.com'}`,
                            title: roles[j] || 'User',
                            tags: [roles[j] || 'User']
                        });
                        currentContacts.push(c);
                        console.log(`    Created Contact for ${account.name}`);
                    }
                }

                // Create fresh activities if needed or always add recent ones for demo
                console.log(`    Generating 20 Activities...`);
                for (let k = 0; k < 20; k++) {
                    const randomContact = currentContacts[Math.floor(Math.random() * currentContacts.length)];
                    const activityType = Object.keys(ENGAGEMENT_WEIGHTS)[Math.floor(Math.random() * 4)];
                    const source = ['Email', 'Website', 'Event'][Math.floor(Math.random() * 3)];
                    const points = ENGAGEMENT_WEIGHTS[activityType];
                    const occurredAt = new Date(); // Fresh "now"

                    await IntentSignal.create({
                        TenantId: tenant.id,
                        AccountId: account.id,
                        ContactId: randomContact.id,
                        activityType: activityType,
                        source: source,
                        occurredAt: occurredAt,
                        dedupeKey: crypto.randomUUID()
                    });

                    // Update Contact
                    await Contact.increment('score', { by: points, where: { id: randomContact.id } });
                    await Contact.increment('intentScore', { by: points, where: { id: randomContact.id } });

                    // Update Account Raw
                    await Account.increment('intentSignals', { by: 1, where: { id: account.id } });
                }

                // Final Aggregation
                const allContacts = await Contact.findAll({ where: { AccountId: account.id }, attributes: ['intentScore'] });
                const totalScore = allContacts.reduce((sum, c) => sum + (c.intentScore || 0), 0);

                await Account.update({
                    intentScore: totalScore,
                    intentTrend: 'Increasing',
                    intentSources: ['Email', 'Website']
                }, { where: { id: account.id } });
            }
        }
        console.log('Strict Seeding Complete.');

    } catch (e) {
        console.error('Seeding Error:', e);
    } finally {
        await sequelize.close();
    }
}

seed();
