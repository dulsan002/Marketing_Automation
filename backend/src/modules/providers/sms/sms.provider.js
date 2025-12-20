/**
 * SMS Provider Interface.
 * Currently uses Console Mock. Ready for Twilio integration.
 */
class SmsProvider {
    constructor() {
        this.name = 'MockSmsProvider';
    }

    async send(phoneNumber, message) {
        // Mock Send
        console.log(`[${this.name}] Sending to ${phoneNumber}: "${message}"`);

        // Simulate Network Delay
        await new Promise(resolve => setTimeout(resolve, 50));

        // Simulate Twilio Response
        return {
            messageId: `SM${Date.now()}${Math.floor(Math.random() * 1000)}`,
            status: 'queued',
            provider: this.name
        };
    }
}

module.exports = new SmsProvider();
