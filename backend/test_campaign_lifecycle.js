const { sequelize } = require('./src/config/database');
const campaignService = require('./src/modules/campaigns/campaign.service');
const Tenant = require('./src/modules/tenants/tenant.model');
const Campaign = require('./src/modules/campaigns/campaign.model');
const EmailCampaignContent = require('./src/modules/campaigns/content/email_content.model');
const Segment = require('./src/modules/segments/segment.model');

// Mock Auth Context
const crypto = require('crypto');
const tenantId = crypto.randomUUID();

async function runTest() {
    try {
        console.log('--- STARTING CAMPAIGN LIFECYCLE TEST ---');

        await sequelize.authenticate();
        await sequelize.query('PRAGMA foreign_keys = OFF');
        await sequelize.sync({ force: true });
        await sequelize.query('PRAGMA foreign_keys = ON');

        // 1. Setup Tenant & Segment
        let tenant = await Tenant.findOne({ where: { id: tenantId } });
        if (!tenant) {
            console.log('Creating test tenant...');
            tenant = await Tenant.create({ id: tenantId, name: 'Test Tenant', domain: 'test.com' });
        }

        console.log('Creating test segment...');
        const segment = await Segment.create({
            TenantId: tenantId,
            name: 'Test Segment for Campaign',
            type: 'Static',
            members: 5 // > 0 to allow activation
        });

        // 2. Create Campaign (DRAFT)
        console.log('Creating Email Campaign...');
        const campaign = await campaignService.createCampaign({
            TenantId: tenantId,
            name: 'Test Email Campaign',
            type: 'Email',
            description: 'Testing backend',
            segmentId: segment.id,
            content: {
                subject: 'Hello World',
                body: 'This is a test email',
                senderName: 'Test Bot',
                senderEmail: 'bot@test.com'
            }
        });
        console.log(`Campaign Created: ${campaign.id}, Status: ${campaign.status}`);

        // Verify Content Table Population
        const emailContent = await EmailCampaignContent.findOne({ where: { subject: 'Hello World' } });
        if (!emailContent) throw new Error('Email Content NOT found in specific table!');
        console.log('✅ Email content correctly saved to EmailCampaignContent table.');

        // 3. Update Campaign (DRAFT)
        console.log('Updating Campaign...');
        const updated = await campaignService.updateCampaign(campaign.id, tenantId, {
            content: { subject: 'Hello Updated World' }
        });
        if (updated.subject !== 'Hello Updated World') throw new Error('Update failed');
        console.log('✅ Campaign updated successfully.');

        // 4. Activate Campaign
        console.log('Activating Campaign...');
        const activated = await campaignService.activateCampaign(campaign.id, tenantId);
        console.log(`Campaign Status: ${activated.status}`);
        if (activated.status !== 'ACTIVE') throw new Error('Activation failed');
        console.log('✅ Campaign Activated.');

        // 5. Try Update Active (Should Fail)
        console.log('Attempting to update Active Campaign (Should Fail)...');
        try {
            await campaignService.updateCampaign(campaign.id, tenantId, { content: { subject: 'Illegal Update' } });
            throw new Error('❌ Failed: Update should have been blocked!');
        } catch (e) {
            if (e.message.includes('Cannot edit a campaign that is active')) {
                console.log('✅ Active Campaign update blocked successfully.');
            } else {
                throw e;
            }
        }

        // 6. Archive Campaign
        console.log('Archiving Campaign...');
        const archived = await campaignService.archive(campaign.id, tenantId);
        console.log(`Campaign Status: ${archived.status}`);
        console.log('✅ Campaign Archived.');

        console.log('--- TEST PASSED SUCCESSFULLY ---');

    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        if (error.errors) {
            error.errors.forEach(e => console.error(`   - ${e.message} (${e.path})`));
        }
        console.error(error.stack && error.stack.split('\n')[0]); // Print first line of stack only
    } finally {
        process.exit();
    }
}

runTest();
