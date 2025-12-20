const { v4: uuidv4 } = require('uuid');
const tenantService = require('../modules/tenants/tenant.service');
const contactService = require('../modules/contacts/contact.service');

const seedBaseData = async (req, res, next) => {
    try {
        console.log('Seeding Base Data...');

        // 1. Create Demo Tenant
        const demoTenantName = 'Demo Corp ' + Math.floor(Math.random() * 1000);
        const tenant = await tenantService.createTenant({
            name: demoTenantName,
            domain: 'demo.com',
            subscriptionPlan: 'pro'
        });
        console.log(`Created Tenant: ${tenant.name} (${tenant.id})`);

        // 2. Create 50+ Contacts
        const contactsToCreate = [];
        const tagsOptions = ['vip', 'lead', 'customer', 'churned', 'new'];

        for (let i = 1; i <= 55; i++) {
            // Random Tags
            const randomTags = [
                tagsOptions[Math.floor(Math.random() * tagsOptions.length)],
                tagsOptions[Math.floor(Math.random() * tagsOptions.length)]
            ];
            // Remove duplicates
            const uniqueTags = [...new Set(randomTags)];

            contactsToCreate.push({
                id: uuidv4(),
                firstName: `User${i}`,
                lastName: `Test`,
                email: `user${i}_${Date.now()}@test.com`,
                phone: `+1-555-01${String(i).padStart(2, '0')}`,
                tags: uniqueTags,
                TenantId: tenant.id
            });
        }

        await contactService.bulkCreateContacts(contactsToCreate);
        console.log(`Created 55 Contacts for Tenant ${tenant.id}`);

        res.status(201).json({
            status: 'success',
            message: 'Seeding complete',
            data: {
                tenantId: tenant.id,
                contactsCreated: 55
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { seedBaseData };
