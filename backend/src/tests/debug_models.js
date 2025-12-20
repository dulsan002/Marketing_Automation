const { sequelize } = require('../config/database');
const Campaign = require('../modules/campaigns/campaign.model');
const CampaignVersion = require('../modules/campaigns/campaign_version.model');

async function debugModels() {
    try {
        console.log('--- Debugging Models ---');
        await sequelize.sync({ force: true });
        console.log('Sync successful');

        const campaign = await Campaign.create({
            name: 'Debug Camp',
            type: 'Email',
            TenantId: '00000000-0000-0000-0000-000000000000' // Mock tenant
        });
        console.log('Campaign created:', campaign.id);

        const version = await CampaignVersion.create({
            campaignId: campaign.id,
            version: 1,
            content: { subject: 'Test' }
        });
        console.log('Version created:', version.id);

        const found = await Campaign.findOne({
            where: { id: campaign.id },
            include: [CampaignVersion]
        });
        console.log('Associations check:', found.CampaignVersions ? 'Success' : 'Failure');

    } catch (error) {
        console.error('Debug failed!');
        console.error('Message:', error.message);
        if (error.original) {
            console.error('Original Error:', error.original.message);
        }
        console.error('Stack:', error.stack);
    } finally {
        await sequelize.close();
    }
}

debugModels();
