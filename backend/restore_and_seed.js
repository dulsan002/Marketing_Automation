const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');
const Tenant = require('./src/modules/auth/tenant.model');
const User = require('./src/modules/auth/user.model');
const Account = require('./src/modules/abm/account.model');
const Contact = require('./src/modules/contacts/contact.model');
const Segment = require('./src/modules/segments/segment.model');
const Workflow = require('./src/modules/workflows/workflow.model');
const Event = require('./src/modules/events/event.model');
const IntentSignal = require('./src/modules/abm/intent_signal.model');
const Campaign = require('./src/modules/campaigns/campaign.model');
const CampaignVersion = require('./src/modules/campaigns/campaign_version.model');
const ActivityLog = require('./src/modules/system/activity_log.model');
const SegmentMembership = require('./src/modules/segments/segment_membership.model');
const Registration = require('./src/modules/events/registration.model');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function restoreAndSeed() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // 1. Sync and Clear existing data
        console.log('Syncing and clearing existing data (force reset)...');

        try {
            // Disable FKs on current connection
            await sequelize.query('PRAGMA foreign_keys = OFF;');

            // Manually drop tables to ensure clean state (in case sync fails to drop)
            const tables = ['WorkflowExecutions', 'IntentSignals', 'Registrations', 'Events', 'Workflows', 'Segments', 'Contacts', 'Activities', 'CampaignVersions', 'Campaigns', 'Accounts', 'Users', 'Tenants'];
            for (const table of tables) {
                await sequelize.query(`DROP TABLE IF EXISTS "${table}";`);
            }
        } catch (err) {
            console.warn('Manual drop failed (ignoring):', err.message);
        }

        // Force sync (recreates tables based on models)
        await sequelize.sync({ force: true });

        // Re-enable Foreign Keys
        await sequelize.query('PRAGMA foreign_keys = ON;');

        console.log('Database synced and cleared.');

        // 2. Restore Tenants from Tenants_backup (Programmatic)
        console.log('Restoring Tenants (Programmatic)...');
        const tenantsBackup = await sequelize.query("SELECT * FROM Tenants_backup;", { type: QueryTypes.SELECT });
        for (const t of tenantsBackup) {
            await Tenant.create({
                id: t.id,
                name: t.name,
                slug: t.slug,
                status: t.status || 'active',
                plan: t.plan || 'free',
                // Ignore domain/subscriptionPlan if they don't exist in model
            });
        }
        console.log(`Restored ${tenantsBackup.length} tenants.`);

        const allTenants = await Tenant.findAll();

        // 3. Create Users for each Tenant (Programmatic)
        console.log('Creating Users...');
        const passwordHash = await bcrypt.hash('Admin@123', 10);
        for (const tenant of allTenants) {
            await User.create({
                tenantId: tenant.id,
                email: `admin@${tenant.slug}.com`,
                password: passwordHash,
                role: 'ADMIN',
                status: 'active'
            });
            await User.create({
                tenantId: tenant.id,
                email: `marketer@${tenant.slug}.com`,
                password: passwordHash,
                role: 'MARKETER',
                status: 'active'
            });
        }
        console.log('Users created.');

        // 4. Restore Accounts from Accounts_backup (Programmatic)
        console.log('Restoring Accounts (Programmatic)...');
        const accountsBackup = await sequelize.query("SELECT * FROM Accounts_backup;", { type: QueryTypes.SELECT });
        for (const a of accountsBackup) {
            const tenantExists = allTenants.find(t => t.id === a.TenantId);
            if (!tenantExists) continue;

            // Handle numeric values safely
            const safeParseFloat = (val) => {
                const parsed = parseFloat(val);
                return isNaN(parsed) ? 0 : parsed;
            };

            await Account.create({
                id: a.id,
                name: a.name || 'Unknown Account',
                industry: a.industry || 'Technology',
                tier: a.tier || 'Tier 3',
                country: a.country || 'USA',
                intentScore: parseInt(a.intentScore) || 0,
                revenue: safeParseFloat(a.revenue),
                employees: parseInt(a.employees) || 0,
                TenantId: a.TenantId,
                intentTrend: a.intentTrend || 'Stable',
                intentSources: a.intentSources ? (typeof a.intentSources === 'string' ? JSON.parse(a.intentSources) : a.intentSources) : [],
                normalizedName: (a.name || 'unknown').toLowerCase()
            });
        }
        console.log(`Restored ${accountsBackup.length} accounts.`);

        // 5. Restore Campaigns from Campaigns_backup (Programmatic to handle null TenantId)
        console.log('Restoring Campaigns...');
        const campaignsBackup = await sequelize.query("SELECT * FROM Campaigns_backup;", { type: QueryTypes.SELECT });
        if (allTenants.length > 0) {
            const defaultTenantId = allTenants[0].id;
            for (const c of campaignsBackup) {
                // Handle missing TenantId by assigning to first tenant
                const tenantId = c.TenantId || defaultTenantId;

                // Use default UUID if id is missing (unlikely for backup)
                const cId = c.id || uuidv4();

                await Campaign.create({
                    id: cId,
                    name: c.name || 'Unnamed Campaign',
                    type: c.type || 'Email',
                    status: c.status || 'DRAFT',
                    currentVersion: c.currentVersion || 1,
                    description: c.description || 'Restored campaign',
                    TenantId: tenantId
                });
            }
        }
        console.log(`Restored ${campaignsBackup.length} campaigns.`);

        // 6. Seed Remaining Tables with non-null data
        console.log('Seeding remaining tables...');
        const allAccounts = await Account.findAll();

        for (const tenant of allTenants) {
            const tenantAccounts = allAccounts.filter(a => a.TenantId === tenant.id);
            for (const acc of tenantAccounts) {
                for (let i = 1; i <= 3; i++) {
                    await Contact.create({
                        firstName: `Contact${i}`,
                        lastName: acc.name,
                        email: `contact${i}@${acc.domain}`,
                        phone: '555-0101',
                        engagementScore: Math.floor(Math.random() * 100),
                        intentScore: Math.floor(Math.random() * 100),
                        TenantId: tenant.id,
                        AccountId: acc.id,
                        tags: ['Imported', 'Target'],
                        lastScoredAt: new Date()
                    });
                }
            }

            // Segments
            const segment = await Segment.create({
                name: 'All Contacts',
                description: 'Automatically generated segment',
                type: 'Dynamic',
                ruleGroups: { condition: 'AND', rules: [] },
                TenantId: tenant.id,
                rulesCount: 0,
                members: 0,
                memberChange: 0,
                lastCalculated: new Date()
            });

            // Workflows
            await Workflow.create({
                name: 'Standard Nurture',
                description: 'Default nurture workflow',
                status: 'active',
                trigger: { type: 'segment_entry', segmentId: segment.id },
                nodes: [],
                edges: [],
                TenantId: tenant.id,
                version: 1
            });

            // Events
            await Event.create({
                name: 'Product Deep Dive',
                type: 'Webinar',
                status: 'Published',
                startDate: new Date(),
                endDate: new Date(Date.now() + 3600000),
                capacity: 100,
                description: 'Join us for a deep dive into our products.',
                TenantId: tenant.id,
                registeredCount: 0
            });
        }

        // Intent Signals
        const allContacts = await Contact.findAll();
        for (const contact of allContacts) {
            await IntentSignal.create({
                accountId: contact.AccountId,
                contactId: contact.id,
                source: 'Website',
                activityType: 'page_visit',
                occurredAt: new Date(),
                dedupeKey: `seed-${contact.id}-${Date.now()}`,
                tenantId: contact.TenantId
            });
        }

        console.log('Seeding completed successfully.');

    } catch (error) {
        console.error('Restoration failed:', error);
    } finally {
        await sequelize.close();
    }
}

restoreAndSeed();
