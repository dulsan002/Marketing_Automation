const smtpProvider = require('./smtp.provider');
const { publish } = require('../../system/event_bus');
const { v4: uuidv4 } = require('uuid');

const TRACKING_URL = process.env.TRACKING_URL || 'http://localhost:3000/api/track';

class EmailService {
    constructor() {
        this.provider = smtpProvider; // Can allow switching via config later
    }

    async sendEmail(campaignId, contact, templateHtml, subject) {
        try {
            console.log(`[EmailService] Sending Campaign ${campaignId} to ${contact.email}`);

            // Generate Event ID for tracking
            const eventId = uuidv4();
            // We could store eventId in DB "EmailLog" here effectively pre-creating the log entry.
            // For now, we rely on the tracking endpoint receiving it.

            // 1. Inject Tracking
            let html = templateHtml;

            // Open Pixel
            const pixelUrl = `${TRACKING_URL}/open/${eventId}`;
            const pixelTag = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`;
            html = html + pixelTag;

            // Link Rewriting (Simple Regex)
            // Replaces href="http..." with href="TRACKING_URL/click/EVENT_ID?url=ENCODED_URL"
            html = html.replace(/href=["'](http[^"']+)["']/g, (match, url) => {
                const encodedUrl = encodeURIComponent(url);
                const trackingLink = `${TRACKING_URL}/click/${eventId}?url=${encodedUrl}`;
                return `href="${trackingLink}"`;
            });

            // 2. Send via Provider
            const result = await this.provider.send(contact.email, subject, html);

            // 3. Publish Success Event
            await publish('map.email.sent', {
                event_type: 'EMAIL_SENT',
                tenant_id: contact.TenantId || contact.tenant_id, // Safety check
                contact_id: contact.id,
                campaign_id: campaignId,
                message_id: result.messageId,
                event_id: eventId, // Used for tracking correlation
                provider: result.provider,
                timestamp: new Date().toISOString()
            });

            return result;
        } catch (error) {
            console.error('[EmailService] Failed:', error.message);
            // Publish Failure Event
            await publish('map.email.failed', {
                event_type: 'EMAIL_FAILED',
                tenant_id: contact.TenantId,
                contact_id: contact.id,
                campaign_id: campaignId,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
}

module.exports = new EmailService();
