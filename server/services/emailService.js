const nodemailer = require("nodemailer");

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
}

/**
 * Sends an email using nodemailer.
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content of the email
 */
async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.warn(`[Mock Email] To: ${to} | Subject: ${subject}`);
    console.warn("Email configuration is missing (.env). Skipping actual send.");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Co-Teacher" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to} [${info.messageId}]`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}

module.exports = {
  sendEmail,
};
