const smsProvider = require('./sms.provider');
const { publish } = require('../../system/event_bus');

class SmsService {
    constructor() {
        this.provider = smsProvider;
    }

    async sendSms(campaignId, contact, message) {
        try {
            if (!contact.phone) {
                console.warn(`[SmsService] Skipping ${contact.id}: No phone number`);
                return null;
            }

            if (message.length > 160) {
                throw new Error('Message exceeds 160 characters');
            }

            console.log(`[SmsService] Sending Campaign ${campaignId} to ${contact.phone}`);

            // 1. Send via Provider
            const result = await this.provider.send(contact.phone, message);

            // 2. Publish Success Event
            await publish('map.sms.sent', {
                event_type: 'SMS_SENT',
                tenant_id: contact.TenantId,
                contact_id: contact.id,
                campaign_id: campaignId,
                message_id: result.messageId,
                provider: result.provider,
                timestamp: new Date().toISOString()
            });

            return result;
        } catch (error) {
            console.error('[SmsService] Failed:', error.message);
            // Optionally publish failure event
            await publish('map.sms.failed', {
                event_type: 'SMS_FAILED',
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

module.exports = new SmsService();
