const Account = require('./account.model');
const Contact = require('../contacts/contact.model');

const IntentSignal = require('./intent_signal.model');
const crypto = require('crypto');
const { sequelize } = require('../../config/database');

const ENGAGEMENT_WEIGHTS = {
    'email_open': 2,
    'link_click': 5,
    'page_visit': 1,
    'event_attend': 10,
    'manual_signal': 1
};

const createAccount = async (data) => {
    const account = await Account.create(data);

    // Auto-create Intent Signal
    try {
        // Create "System" signal
        const occurredAt = new Date();
        const dedupeKey = crypto.createHash('sha256')
            .update(`${data.TenantId}${account.id}systemnew_accountsystem${occurredAt.toISOString().slice(0, 16)}`)
            .digest('hex');

        await IntentSignal.create({
            tenantId: data.TenantId,
            accountId: account.id,
            source: 'System',
            activityType: 'new_account',
            dedupeKey: dedupeKey,
            occurredAt: occurredAt
        });

        // FIXED: Create signals for manually selected sources so they persist
        if (data.intentSources && Array.isArray(data.intentSources)) {
            console.log('Processing Manual Intent Sources:', data.intentSources);
            for (const source of data.intentSources) {
                if (source === 'System') continue; // Already created

                const sourceKey = crypto.createHash('sha256')
                    .update(`${data.TenantId}${account.id}${source}manual_init${occurredAt.toISOString()}`)
                    .digest('hex');

                try {
                    await IntentSignal.create({
                        tenantId: data.TenantId,
                        accountId: account.id,
                        source: source,
                        activityType: 'manual_selection',
                        dedupeKey: sourceKey,
                        occurredAt: occurredAt
                    });
                    console.log('Created Manual Signal:', source);
                } catch (signalErr) {
                    console.error('Failed to create manual signal for ' + source, signalErr);
                }
            }
        }

        // Ensure account is immediately updated. For new account, score is 0.
        // We still call this to init trend/signals if needed.
        await updateAccountIntentData(account.id, data.TenantId);
    } catch (e) {
        console.error('CRITICAL: Failed to create initial Intent Signals', e);
        if (e.name !== 'SequelizeUniqueConstraintError') {
            // throw e; // don't throw to allow account creation
        }
    }

    return account;
};

const getAccounts = async (tenantId) => {
    return await Account.findAll({
        where: { TenantId: tenantId },
        order: [['intentScore', 'DESC']]
    });
};

const getAccountById = async (id, tenantId) => {
    const account = await Account.findOne({
        where: { id, TenantId: tenantId },
        include: [
            { model: Contact }, // Buying Committee
            { model: IntentSignal } // Intent Signals
        ]
    });
    if (!account) throw new Error('Account not found');
    return account;
};

const updateAccount = async (id, tenantId, updates) => {
    const account = await getAccountById(id, tenantId);
    return await account.update(updates);
};

const updateAccountIntentScore = async (accountId) => {
    // 1. Sum up all contact intent scores for this account
    const contacts = await Contact.findAll({
        where: { AccountId: accountId },
        attributes: ['intentScore']
    });

    const totalIntent = contacts.reduce((sum, c) => sum + (c.intentScore || 0), 0);

    await Account.update({ intentScore: totalIntent }, { where: { id: accountId } });
};

const processActivity = async (tenantId, contactId, accountId, activityType, source) => {
    const occurredAt = new Date();
    // Round to minute for dedupe: YYYY-MM-DDTHH:mm
    const timeKey = occurredAt.toISOString().slice(0, 16);

    const rawKey = `${tenantId}${contactId}${activityType}${source}${timeKey}`;
    const dedupeKey = crypto.createHash('sha256').update(rawKey).digest('hex');

    try {
        // 1. Try to create IntentSignal
        await IntentSignal.create({
            tenantId,
            accountId,
            contactId,
            activityType,
            source,
            dedupeKey,
            occurredAt
        });

        // 2. If successful (not duplicate):
        const points = ENGAGEMENT_WEIGHTS[activityType] || 1;

        // A. Update Contact Scores
        const contact = await Contact.findOne({ where: { id: contactId, TenantId: tenantId } });
        if (contact) {
            await contact.increment('intentScore', { by: points });
            await contact.increment('score', { by: points });
            // engagementScore might ideally be same or different, updating needed? 
            // Previous code updated engagementScore. Let's keep it to be safe for other modules.
            await contact.increment('engagementScore', { by: points });
        }

        // B. Update Account Intent Signals Count (Raw)
        if (accountId) {
            await Account.increment('intentSignals', { by: 1, where: { id: accountId } });

            // C. Update Account Aggregated Score
            await updateAccountIntentScore(accountId);

            // D. Update Trend/Sources
            await updateAccountIntentData(accountId, tenantId);
        }

    } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') {
            return;
        }
        console.error('Error processing activity', e);
        throw e;
    }
};

const updateAccountIntentData = async (accountId, tenantId) => {
    const { Op } = require('sequelize');
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 1. Fetch Current Window Signals (0-7 days)
    const currentSignals = await IntentSignal.findAll({
        where: {
            accountId,
            tenantId,
            occurredAt: { [Op.gte]: sevenDaysAgo }
        }
    });

    // 2. Fetch Previous Window Signals (7-14 days)
    const previousSignalCount = await IntentSignal.count({
        where: {
            accountId,
            tenantId,
            occurredAt: {
                [Op.gte]: fourteenDaysAgo,
                [Op.lt]: sevenDaysAgo
            }
        }
    });

    const currentCount = currentSignals.length;

    // 3. Determine Trend
    let trend = 'Stable';
    if (currentCount > previousSignalCount) trend = 'Rising';
    else if (currentCount < previousSignalCount) trend = 'Declining';

    // 4. Extract Distinct Sources
    const sources = [...new Set(currentSignals.map(s => s.source))];

    // 5. Persist to Account (Only Trend and Sources, IntentScore is aggregated from Contacts in updateAccountIntentScore)
    // We do NOT overwrite intentScore here.
    await Account.update({
        intentTrend: trend,
        intentSources: sources
    }, { where: { id: accountId } });
};

// Global ABM Fetchers
// Global ABM Fetchers
const getGlobalIntentSignals = async (tenantId) => {
    // Return ACCOUNTS that have intent, formatted as signals
    // Logic: Intent Page shows "Accounts" with their computed intent data.
    const accounts = await Account.findAll({
        where: {
            TenantId: tenantId,
            tier: { [require('sequelize').Op.in]: ['Tier 1', 'Tier 2'] } // Show all T1/T2 regardless of score
        },
        order: [['intentScore', 'DESC']]
    });

    // Map to the structure expected by frontend (IntentSignal-like, but actually Account Summary)
    // Frontend Model: { accountId, accountName, score, trend, sources... }
    return accounts.map(a => ({
        id: a.id,
        accountId: a.id,
        accountName: a.name || 'Unknown Account',
        score: a.intentScore || 0,
        trend: a.intentTrend || 'Stable',
        sources: (a.intentSources && a.intentSources.length) ? a.intentSources : ['System'],
        occurredAt: a.updatedAt,
        solutionCategory: a.industry || 'Technology' // Default to Tech if missing
    }));
};

const getGlobalBuyingCommittees = async (tenantId) => {
    // Return all accounts, even if they have no contacts yet
    const accounts = await Account.findAll({
        where: { TenantId: tenantId },
        include: [{ model: Contact }],
        order: [['name', 'ASC']]
    });

    // Return all accounts so they appear in the Buying Committee list
    return accounts;
};

const addCommitteeMember = async (accountId, tenantId, memberData) => {
    const { email, role, influence, title, firstName, lastName } = memberData;

    // 1. Strict Requirement: member must be in Contact system
    let contact = await Contact.findOne({ where: { email, TenantId: tenantId } });

    if (!contact) {
        throw new Error(`Contact not found: ${email}. Member must be in Contact system.`);
    }

    // 2. Cross-Company Restriction: Contact cannot belong to another account
    const account = await Account.findOne({ where: { id: accountId, TenantId: tenantId } });
    if (!account) throw new Error('Account not found');

    if (contact.AccountId && contact.AccountId !== accountId) {
        const otherAccount = await Account.findByPk(contact.AccountId);
        throw new Error(`Contact ${email} is already associated with another company: ${otherAccount ? otherAccount.name : contact.AccountId}.`);
    }

    // 3. Domain Validation (Optional but recommended for strictness)
    if (account.domain) {
        const emailDomain = email.split('@')[1];
        if (emailDomain && emailDomain.toLowerCase() !== account.domain.toLowerCase()) {
            throw new Error(`Contact domain (${emailDomain}) does not match account domain (${account.domain}).`);
        }
    }

    // 4. Link to Account
    // Also update metadata like Title or Role (stored in tags for now as per schema limitations)
    // We append Role to tags if not present.
    let tags = contact.tags || [];
    if (role && !tags.includes(role)) tags.push(role);

    await contact.update({
        AccountId: accountId,
        title: title || contact.title,
        tags: tags
    });

    return contact;
};

const updateCommitteeMember = async (accountId, tenantId, memberId, updates) => {
    const { role } = updates;

    const contact = await Contact.findOne({ where: { id: memberId, TenantId: tenantId } });
    if (!contact) throw new Error('Contact not found');

    // Update Role in tags
    if (role) {
        // Simple logic: Replace existing role tags or reset tags to just [role]
        // Preserving other tags is better, but tricky without defining what IS a role tag.
        // I'll assume for this ABM module, tags = roles.
        await contact.update({ tags: [role] });
    }

    return contact;
};

const removeCommitteeMember = async (accountId, tenantId, memberId) => {
    const contact = await Contact.findOne({ where: { id: memberId, TenantId: tenantId } });
    if (!contact) throw new Error('Contact not found');

    if (contact.AccountId !== accountId) {
        throw new Error('Contact is not a member of this account committee');
    }

    // Unlink from Account
    // Optional: We could also remove role tags, but keeping them might be useful history?
    // Let's remove them to keep it clean as "not a member aka not a role holder anymore".
    // Actually, tags might contain other things. Let's just unlink.
    await contact.update({
        AccountId: null,
        title: contact.title // No change to title
        // tags: [] // unsafe to clear all tags
    });

    return true;
};

const getAbmAnalytics = async (tenantId) => {
    // 1. Account Tiers Distribution
    const tierCounts = await Account.findAll({
        where: { TenantId: tenantId },
        attributes: ['tier', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['tier'],
        raw: true
    });
    // Format: [{ tier: 'Tier 1', count: 5 }, ...]

    // 2. Pipeline Value (Sum of Revenue)
    const revenueSum = await Account.sum('revenue', { where: { TenantId: tenantId } });

    // 3. Active Accounts Count
    const activeCount = await Account.count({ where: { TenantId: tenantId } });

    // 3.5 Avg Intent Score and Intent Signals
    // Avg Score
    const accounts = await Account.findAll({ where: { TenantId: tenantId }, attributes: ['intentScore'] });
    const totalScore = accounts.reduce((sum, a) => sum + (a.intentScore || 0), 0);
    const avgScore = accounts.length ? Math.round(totalScore / accounts.length) : 0;

    // Intent Signals Count (Global)
    const intentSignalsCount = await IntentSignal.count({ where: { tenantId } });

    // Intent Signals by Source
    const signalsBySource = await IntentSignal.findAll({
        where: { tenantId },
        attributes: ['source', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['source'],
        raw: true
    });
    // Format: [{ source: 'LinkedIn', count: 10 }, ...]

    // 4. Top Performing Accounts (by Intent Score)
    const topAccounts = await Account.findAll({
        where: { TenantId: tenantId },
        order: [['intentScore', 'DESC']],
        limit: 5,
        attributes: ['id', 'name', 'intentScore', 'tier'] // Removed 'change' as it's computed/mocked
    });

    // Extract T1 Count
    const t1Obj = tierCounts.find(t => t.tier === 'Tier 1');
    const t1Count = t1Obj ? Number(t1Obj.count) : 0;

    return {
        totalAccounts: activeCount, // Assuming total = active for now
        activeAccounts: activeCount,
        t1Accounts: t1Count,
        avgIntentScore: avgScore,
        intentSignals: intentSignalsCount,
        signalsBySource: signalsBySource.map(s => ({ source: s.source, count: Number(s.count) })),
        pipelineValue: revenueSum || 0,
        accountTiers: tierCounts.map(t => ({ tier: t.tier === 'Tier 1' ? 'T1' : t.tier === 'Tier 2' ? 'T2' : 'T3', count: Number(t.count) })),
        topAccounts: topAccounts.map(a => ({
            id: a.id,
            name: a.name,
            score: a.intentScore || 0,
            change: 0,
            tier: a.tier === 'Tier 1' ? 'T1' : a.tier === 'Tier 2' ? 'T2' : 'T3'
        }))
    };
};

module.exports = {
    createAccount,
    getAccounts,
    getAccountById,
    updateAccount,
    processActivity,
    getGlobalIntentSignals,
    getGlobalBuyingCommittees,
    addCommitteeMember,
    updateCommitteeMember,
    removeCommitteeMember,
    removeCommitteeMember,
    updateAccountIntentScore,
    updateAccountIntentData,
    getAbmAnalytics
};
