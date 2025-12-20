const Contact = require('./contact.model');

const eventBus = require('../../common/event_bus');

const { Op } = require('sequelize');

const createContact = async (data) => {
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
    bulkCreateContacts
};
