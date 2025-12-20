/**
 * Email Service (Mock)
 * Handles sending transactional emails.
 * 
 * In a real application, this would integrate with SendGrid, AWS SES, or similar.
 * For now, it logs email content to the console for verification.
 */

const sendEmail = async ({ to, subject, html, text }) => {
    console.log(`
    ==================================================
    [EMAIL SENT]
    To: ${to}
    Subject: ${subject}
    --------------------------------------------------
    Content:
    ${text || html.replace(/<[^>]*>?/gm, '')}
    ==================================================
    `);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
};

const sendRegistrationApprovedEmail = async (contact, event) => {
    const badgeUrl = `http://localhost:4200/events/badge/${event.id}/${contact.id}`; // Hypothetical URL

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Registration Approved!</h2>
            <p>Hi ${contact.firstName},</p>
            <p>Your registration for <strong>${event.name}</strong> has been approved.</p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()}</p>
                <p><strong>Venue:</strong> ${event.venue || 'Online'}</p>
            </div>

            <p>Please present the attached badge at the entrance.</p>
            
            <div style="border: 2px solid #000; padding: 20px; text-align: center; margin: 30px 0;">
                <h3 style="margin:0">${contact.firstName} ${contact.lastName}</h3>
                <p style="color: #666;">${contact.company || ''}</p>
                <div style="background: #eee; width: 100px; height: 100px; margin: 10px auto;">[QR CODE]</div>
                <p style="font-size: 12px; color: #999;">${event.name} - VISITOR</p>
            </div>

            <p>See you there,<br>The Team</p>
        </div>
    `;

    return sendEmail({
        to: contact.email,
        subject: `You're in! Registration Approved for ${event.name}`,
        html: html,
        text: `Your registration for ${event.name} has been approved. See you there!`
    });
};

module.exports = {
    sendEmail,
    sendRegistrationApprovedEmail
};
