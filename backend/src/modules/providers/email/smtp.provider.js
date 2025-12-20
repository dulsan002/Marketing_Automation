const nodemailer = require('nodemailer');

class SmtpProvider {
    constructor() {
        this.transporter = null;
        this.init();
    }

    async init() {
        if (process.env.SMTP_HOST) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
            console.log('📧 SMTP Provider Initialized');
        } else {
            // Ethereal / Mock for Dev
            // In a real app we might use nodemailer.createTestAccount() but for speed/reliability in keeping these logs clean:
            // We'll just define a JSON transport if not configured, or a simple "Stub" transport.

            // For now, let's just log if not configured.
            console.log('⚠️ No SMTP Configured. Using Console Mock.');
        }
    }

    async send(to, subject, html) {
        if (!this.transporter) {
            console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
            console.log(`[CONTENT] ${html.substring(0, 50)}...`);
            return { messageId: `mock-${Date.now()}`, status: 'sent', provider: 'mock' };
        }

        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"RevOps Platform" <noreply@revops.com>',
                to,
                subject,
                html,
            });
            return { messageId: info.messageId, status: 'sent', provider: 'smtp' };
        } catch (error) {
            console.error('SMTP Send Error:', error);
            throw error;
        }
    }
}

module.exports = new SmtpProvider();
