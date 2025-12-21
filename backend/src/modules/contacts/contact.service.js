const Contact = require('./contact.model');

const eventBus = require('../../common/event_bus');

const { Op } = require('sequelize');

const Account = require('../abm/account.model');

const ensureAccount = async (tenantId, companyName) => {
    if (!companyName || !companyName.trim()) return null;

    const normalized = companyName.trim();

    // Find existing account
    let account = await Account.findOne({
        where: {
            TenantId: tenantId,
            name: normalized // We might want ILIKE here if DB supports it, but exact match for now
        }
    });

    if (!account) {
        // Create new account
        account = await Account.create({
            name: normalized,
            TenantId: tenantId,
            domain: '', // Enriched later?
            tier: 'Tier 3' // Default
        });
    }

    return account.id;
};

const createContact = async (data) => {
    // Sync Account
    if (data.company) {
        const accountId = await ensureAccount(data.TenantId, data.company);
        if (accountId) {
            data.AccountId = accountId;
        }
    }

    const contact = await Contact.create(data);
    eventBus.emit('contact.created', { tenantId: data.TenantId, contactId: contact.id });
    return contact;
};

const getContacts = async (tenantId, search = '') => {
    const where = { TenantId: tenantId };

    if (search) {
        where[Op.or] = [
            { firstName: { [Op.like]: `%${search}%` } },
            { lastName: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { company: { [Op.like]: `%${search}%` } }
        ];
    }

    return await Contact.findAll({ where });
};

const getContactById = async (id, tenantId) => {
    const contact = await Contact.findOne({ where: { id, TenantId: tenantId } });
    if (!contact) throw new Error('Contact not found');
    return contact;
};

const updateContact = async (id, tenantId, updates) => {
    const contact = await getContactById(id, tenantId);

    // Sync Account on Update
    if (updates.company && updates.company !== contact.company) {
        const accountId = await ensureAccount(tenantId, updates.company);
        if (accountId) {
            updates.AccountId = accountId;
        }
    }

    return await contact.update(updates);
};

const deleteContact = async (id, tenantId) => {
    const contact = await getContactById(id, tenantId);
    return await contact.destroy();
};

const countContacts = async (tenantId) => {
    return await Contact.count({ where: { TenantId: tenantId } });
};

const bulkCreateContacts = async (contacts) => {
    return await Contact.bulkCreate(contacts);
};

module.exports = {
    createContact,
    getContacts,
    getContactById,
    updateContact,
    deleteContact,
    countContacts,
    bulkCreateContacts,
    ensureAccount // Exporting for reuse in EventService
};
