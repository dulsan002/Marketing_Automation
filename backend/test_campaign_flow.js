
const { login } = require('./src/modules/auth/auth.service');
const { getSegments } = require('./src/modules/segments/segment.service');
const { createCampaign, getCampaignById } = require('./src/modules/campaigns/campaign.service');
const { sequelize } = require('./src/config/database');

const testCampaign = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // 1. Login
        const tenantSlug = 'acme-corp';
        const email = 'admin@example.com';
        const password = 'admin123';
        console.log(`\n1. Logging in as ${email}...`);
        const loginResult = await login(tenantSlug, email, password);
        const { user } = loginResult;
        console.log('Login successful.');

        // 2. Fetch Segments
        console.log('\n2. Fetching Segments...');
        const segments = await getSegments(user.tenantId);
        console.log(`Found ${segments.length} segments.`);
        if (segments.length === 0) throw new Error('No segments found! Seed segments first.');

        const segmentId = segments[0].id;
        console.log(`Selected Segment: ${segments[0].name} (${segmentId})`);

        // 3. Create Campaign
        console.log('\n3. Creating Campaign...');
        const campaignData = {
            name: `Test Campaign ${Date.now()}`,
            type: 'Email',
            status: 'DRAFT',
            description: 'Automated test campaign',
            senderName: 'Marketing Team',
            senderEmail: 'marketing@acme.com',
            subject: 'Hello World',
            body: '<p>This is a test email.</p>',
            segmentId: segmentId,
            TenantId: user.tenantId, // Service usually expects this injected or passed
            createdBy: user.id
        };

        const newCampaign = await createCampaign(campaignData);
        console.log(`Campaign Created: ${newCampaign.name} (${newCampaign.id})`);

        // 4. Verify in DB
        console.log('\n4. Verifying Retrieval...');
        const fetched = await getCampaignById(newCampaign.id, user.tenantId);
        if (fetched && fetched.segmentId === segmentId) {
            console.log('SUCCESS: Campaign verified in DB with correct Segment Link.');
        } else {
            console.error('FAILURE: Campaign not found or Segment ID mismatch.');
        }

    } catch (e) {
        console.error('TEST FAILED:', e);
    } finally {
        await sequelize.close();
    }
};

testCampaign();
