const { sequelize } = require('../config/database');
const accountService = require('../modules/abm/account.service');
const Account = require('../modules/abm/account.model');
const Contact = require('../modules/contacts/contact.model');
const IntentSignal = require('../modules/abm/intent_signal.model');
const Tenant = require('../modules/auth/tenant.model');

describe('ABM Scoring & Intent Logic', () => {
    let tenantId;
    let accountId;
    let contactId;

    beforeAll(async () => {
        // Sync DB
        require('../modules/auth/tenant.model');
        require('../modules/abm/account.model');
        require('../modules/contacts/contact.model');
        require('../modules/abm/intent_signal.model');

        const { syncDb } = require('./test_helper');
        await syncDb();

        // Setup Tenant
        const tenant = await Tenant.create({ name: 'Test Corp', slug: 'test-corp' });
        tenantId = tenant.id;

        // Setup Account
        const account = await Account.create({
            name: 'Target Account',
            TenantId: tenantId,
            intentScore: 0
        });
        accountId = account.id;

        // Setup Contact
        const contact = await Contact.create({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@target.com',
            TenantId: tenantId,
            AccountId: accountId
        });
        contactId = contact.id;
    });

    test('1. Separation of Engagement & Intent Scores', async () => {
        // Process 'email_open' (+5 Engagement, +1 Intent)
        await accountService.processActivity(tenantId, contactId, accountId, 'email_open', 'campaign_email_1');

        const contact = await Contact.findByPk(contactId);

        expect(contact.engagementScore).toBe(5);
        expect(contact.intentScore).toBe(1);
    });

    test('2. Strict Deduplication (Same Minute)', async () => {
        // Try same activity again immediately
        await accountService.processActivity(tenantId, contactId, accountId, 'email_open', 'campaign_email_1');

        const contact = await Contact.findByPk(contactId);

        // Scores should NOT change
        expect(contact.engagementScore).toBe(5);
        expect(contact.intentScore).toBe(1);

        // Signal count should still be 1 (plus the auto-generated "New Account" signal likely created alongside account, let's check strict count for this type)
        const signals = await IntentSignal.findAll({
            where: { contactId, activityType: 'email_open' }
        });
        expect(signals.length).toBe(1);
    });

    test('3. Different Activity Adds to Scores', async () => {
        // Process 'link_click' (+10 Engagement, +1 Intent) - NEW source to ensure unique key if different
        // Actually same source/type is deduped. New Type = New Signal.
        await accountService.processActivity(tenantId, contactId, accountId, 'link_click', 'campaign_email_1');

        const contact = await Contact.findByPk(contactId);

        // Previous (5, 1) + New (10, 1) = (15, 2)
        expect(contact.engagementScore).toBe(15);
        expect(contact.intentScore).toBe(2);
    });

    test('4. Account Intent Aggregation', async () => {
        // Add another contact to account
        const contact2 = await Contact.create({
            firstName: 'John',
            lastName: 'Smith',
            email: 'john@target.com',
            TenantId: tenantId,
            AccountId: accountId
        });

        // Add 3 intent signals to Contact 2
        // We need unique sources or types to avoid dedupe if running fast
        await accountService.processActivity(tenantId, contact2.id, accountId, 'page_visit', 'pricing'); // +1
        await accountService.processActivity(tenantId, contact2.id, accountId, 'page_visit', 'blog');    // +1
        await accountService.processActivity(tenantId, contact2.id, accountId, 'event_attend', 'webinar'); // +1

        const c2 = await Contact.findByPk(contact2.id);
        expect(c2.intentScore).toBe(3);

        // Account Intent should be Normalized(Sum(C1=2) + Sum(C2=3) = 5) 
        // 5 signals out of 20 = 25%
        const account = await Account.findByPk(accountId);
        expect(account.intentScore).toBe(25);
        expect(account.intentTrend).toBe('Increasing');
    });
});
