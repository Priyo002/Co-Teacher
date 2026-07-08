const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using Resend.
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content of the email
 */
async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[Mock Email] To: ${to} | Subject: ${subject}`);
    console.warn("Resend API key is missing (.env). Skipping actual send.");
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Co-Teacher <hello@co-teacher.me>',
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error(`Failed to send email to ${to} via Resend:`, error);
      return false;
    }

    console.log(`Email sent successfully to ${to} [${data.id}]`);
    return true;
  } catch (error) {
    console.error(`Unexpected error sending email to ${to}:`, error);
    return false;
  }
}

module.exports = {
  sendEmail,
};
