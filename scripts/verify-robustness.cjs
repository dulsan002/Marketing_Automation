const { sequelize } = require('../backend/src/config/database');
const Tenant = require('../backend/src/modules/auth/tenant.model');
const Account = require('../backend/src/modules/abm/account.model');
const Contact = require('../backend/src/modules/contacts/contact.model');

async function verifyData() {
    try {
        console.log('🔍 Starting Data Verification...');

        const tenants = await Tenant.findAll();
        let allPass = true;

        for (const tenant of tenants) {
            console.log(`\nChecking Tenant: ${tenant.name}`);

            // Check Accounts
            const accounts = await Account.findAll({ where: { TenantId: tenant.id } });
            if (accounts.length < 3) {
                console.error(`❌ FAILED: Tenant has only ${accounts.length} accounts (Expected >= 3)`);
                allPass = false;
            } else {
                console.log(`   ✅ Accounts: ${accounts.length}`);
            }

            // Check Contacts per Account
            for (const acc of accounts) {
                if (!acc.name || !acc.domain || !acc.industry) {
                    console.error(`❌ FAILED: Account ${acc.id} has null fields`);
                    allPass = false;
                }

                const contacts = await Contact.findAll({ where: { AccountId: acc.id } });
                if (contacts.length < 3) {
                    console.error(`   ❌ FAILED: Account "${acc.name}" has only ${contacts.length} contacts (Expected >= 3)`);
                    allPass = false;
                } else {
                    // Check for nulls
                    const nullContacts = contacts.filter(c => !c.firstName || !c.lastName || !c.email);
                    if (nullContacts.length > 0) {
                        console.error(`   ❌ FAILED: Account "${acc.name}" has contacts with null values`);
                        allPass = false;
                    }
                }
            }
        }

        if (allPass) {
            console.log('\n✨ VERIFICATION PASSED: All tenants have required robust data.');
            process.exit(0);
        } else {
            console.error('\n❌ VERIFICATION FAILED: See errors above.');
            process.exit(1);
        }

    } catch (e) {
        console.error('Verification Error:', e);
        process.exit(1);
    }
}

verifyData();
