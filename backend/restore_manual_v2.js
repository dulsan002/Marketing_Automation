const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');
const Tenant = require('./src/modules/auth/tenant.model');
const User = require('./src/modules/auth/user.model');
const Account = require('./src/modules/abm/account.model');
const Contact = require('./src/modules/contacts/contact.model');
const bcrypt = require('bcryptjs');

async function run() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // 1. Restore Tenants from Backup
        console.log('Syncing Tenants from Backup...');
        const backups = await sequelize.query("SELECT * FROM Tenants_backup", { type: QueryTypes.SELECT });
        for (const b of backups) {
            const [t, created] = await Tenant.findOrCreate({
                where: { id: b.id },
                defaults: {
                    name: b.name,
                    slug: b.slug,
                    status: b.status || 'active',
                    plan: b.plan || 'free',
                    createdAt: b.createdAt,
                    updatedAt: b.updatedAt
                    // Ignore domain/subscriptionPlan checking as verified earlier they don't exist in model
                }
            });
            console.log(`Tenant ${t.slug} (${t.id}) ${created ? 'created' : 'exists'}`);
        }

        const tenants = await Tenant.findAll();

        // 2. Add Data Manually (Users, Accounts, Contacts)
        console.log('Adding Manual Data...');
        const hash = await bcrypt.hash('Admin@123', 10);

        for (const t of tenants) {
            // User
            const [u, uCreated] = await User.findOrCreate({
                where: { email: `admin@${t.slug}.com` },
                defaults: {
                     tenantId: t.id,
                     password: hash,
                     role: 'ADMIN',
                     status: 'active'
                }
            });
            console.log(`User admin@${t.slug}.com ${uCreated ? 'created' : 'exists'}`);

            // Account (Manual & Backup Hybrid)
            // First, restore accounts from backup for this tenant
            const accBackups = await sequelize.query(
                `SELECT * FROM Accounts_backup WHERE "TenantId" = '${t.id}'`, 
                { type: QueryTypes.SELECT }
            );
            
            let accounts = [];

            if (accBackups.length > 0) {
                 for (const ab of accBackups) {
                     const [restoredAcc] = await Account.findOrCreate({
                         where: { id: ab.id },
                         defaults: {
                             name: ab.name,
                             domain: ab.domain,
                             industry: ab.industry,
                             tier: ab.tier,
                             country: ab.country,
                             intentScore: ab.intentScore,
                             revenue: ab.revenue,
                             employees: ab.employees,
                             TenantId: t.id,
                             intentTrend: ab.intentTrend,
                             normalizedName: ab.name ? ab.name.toLowerCase() : null
                         }
                     });
                     accounts.push(restoredAcc);
                 }
                 console.log(`Restored ${accBackups.length} accounts from backup for ${t.slug}`);
            } 
            
            // Always ensure at least one "Manual" account exists if backup was empty OR just to be sure
            if (accounts.length === 0) {
                 const [acc, accCreated] = await Account.findOrCreate({
                    where: { domain: `${t.slug}-manual.com` },
                    defaults: {
                        name: `${t.name} Manual Account`,
                        industry: 'Technology',
                        tier: 'Tier 1',
                        country: 'USA',
                        intentScore: 50,
                        revenue: 500000,
                        employees: 50,
                        TenantId: t.id,
                        intentTrend: 'Stable',
                        intentSources: ['Manual'],
                        normalizedName: `${t.name} manual account`.toLowerCase()
                    }
                });
                accounts.push(acc);
                console.log(`Manual Account created for ${t.slug}`);
            }
            
            // Contacts - Add to first account
            if (accounts.length > 0) {
                const targetAcc = accounts[0];
                const contactCount = await Contact.count({ where: { AccountId: targetAcc.id } });
                
                if (contactCount === 0) {
                    await Contact.create({
                        firstName: 'Manual',
                        lastName: 'User',
                        email: `manual@${targetAcc.domain || 'test.com'}`,
                        phone: '123-123-1234',
                        TenantId: t.id,
                        AccountId: targetAcc.id,
                        engagementScore: 10,
                        intentScore: 10
                    });
                    console.log(`Manual Contact created for ${targetAcc.name}`);
                }
            }
        }

    } catch (e) { console.error('Error:', e); }
    finally { await sequelize.close(); }
}

run();
