const Tenant = require('./tenant.model');

const createTenant = async (data) => {
    return await Tenant.create(data);
};

const getAllTenants = async () => {
    return await Tenant.findAll();
};

const getTenantById = async (id) => {
    return await Tenant.findByPk(id);
};

module.exports = {
    createTenant,
    getAllTenants,
    getTenantById
};
