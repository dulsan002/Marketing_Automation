const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');
const Tenant = require('./src/modules/auth/tenant.model');
const User = require('./src/modules/auth/user.model');
const Account = require('./src/modules/abm/account.model');
const Contact = require('./src/modules/contacts/contact.model');
const bcrypt = require('bcryptjs');

async function finalRestore() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // 1. Restore Tenants from Backup
        console.log('Restoring Tenants from Tenants_backup...');
        const tenantsBackup = await sequelize.query("SELECT * FROM Tenants_backup", { type: QueryTypes.SELECT });

        for (const t of tenantsBackup) {
            await Tenant.findOrCreate({
                where: { id: t.id },
                defaults: {
                    name: t.name,
                    slug: t.slug,
                    status: t.status,
                    plan: t.plan,
                    // valid fields only
                }
            });
        }
        console.log(`Restored/Verified ${tenantsBackup.length} tenants.`);

        const allTenants = await Tenant.findAll();
        if (allTenants.length === 0) {
            console.error('No tenants found even after restore! Cannot create users.');
            return;
        }

        // 2. Add Data for User (Admin)
        console.log('Adding User data...');
        const passwordHash = await bcrypt.hash('Admin@123', 10);

        for (const tenant of allTenants) {
            await User.findOrCreate({
                where: { email: `admin@${tenant.slug}.com` },
                defaults: {
                    tenantId: tenant.id,
                    password: passwordHash,
                    role: 'ADMIN',
                    status: 'active'
                }
            });
            await User.findOrCreate({
                where: { email: `marketer@${tenant.slug}.com` },
                defaults: {
                    tenantId: tenant.id,
                    password: passwordHash,
                    role: 'MARKETER',
                    status: 'active'
                }
            });
        }
        console.log('Users added.');

        // 3. Restore Accounts & Add Contacts
        console.log('Restoring Accounts and adding Contacts...');
        const accountsBackup = await sequelize.query("SELECT * FROM Accounts_backup", { type: QueryTypes.SELECT });

        for (const a of accountsBackup) {
            // Ensure tenant exists
            const tenant = allTenants.find(t => t.id === a.TenantId);
            if (!tenant) continue;

            const [account] = await Account.findOrCreate({
                where: { id: a.id },
                defaults: {
                    name: a.name,
                    domain: a.domain,
                    industry: a.industry,
                    tier: a.tier,
                    country: a.country,
                    intentScore: a.intentScore || 0,
                    revenue: a.revenue,
                    employees: a.employees,
                    TenantId: a.TenantId,
                    intentTrend: a.intentTrend || 'Stable',
                    normalizedName: (a.name || '').toLowerCase()
                }
            });

            // Add Contacts for this account
            const contactCount = await Contact.count({ where: { AccountId: account.id } });
            if (contactCount === 0) {
                await Contact.create({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: `john.doe@${account.domain || 'example.com'}`,
                    phone: '123-456-7890',
                    TenantId: tenant.id,
                    AccountId: account.id,
                    engagementScore: 50,
                    intentScore: 40
                });
                await Contact.create({
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: `jane.smith@${account.domain || 'example.com'}`,
                    phone: '987-654-3210',
                    TenantId: tenant.id,
                    AccountId: account.id,
                    engagementScore: 60,
                    intentScore: 70
                });
            }
        }
        console.log('Accounts and Contacts restored.');

    } catch (error) {
        console.error('Final restore failed:', error);
    } finally {
        await sequelize.close();
    }
}

finalRestore();
