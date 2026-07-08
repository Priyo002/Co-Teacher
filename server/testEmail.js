require('dotenv').config();
const { sendEmail } = require('./services/emailService');

async function runTest() {
  console.log("\n==============================================");
  console.log("📧 TESTING EMAIL CONFIGURATION");
  console.log("==============================================\n");

  const testEmailAddress = process.env.EMAIL_USER;

  if (!testEmailAddress) {
    console.error("❌ ERROR: EMAIL_USER is not set in your .env file!");
    console.log("Please make sure your .env file has EMAIL_USER and EMAIL_APP_PASSWORD configured.");
    return;
  }

  console.log(`Attempting to send a test email to: ${testEmailAddress}...\n`);

  const success = await sendEmail({
    to: testEmailAddress,
    subject: "🚀 Test Email from Co-Teacher!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; text-align: center; padding: 40px; border: 2px solid #4F46E5; border-radius: 12px;">
        <h1 style="color: #4F46E5;">It Works! 🎉</h1>
        <p style="font-size: 18px;">Your NodeMailer configuration is absolutely perfect.</p>
        <p>Your backend is now ready to send Welcome Emails and Payment Receipts!</p>
      </div>
    `
  });

  console.log("\n----------------------------------------------");
  if (success) {
    console.log("✅ SUCCESS! The email was sent.");
    console.log(`Please check the inbox for ${testEmailAddress}.`);
  } else {
    console.log("❌ FAILED! The email could not be sent.");
    console.log("Double check that your 16-digit App Password is correct and has no spaces.");
  }
  console.log("----------------------------------------------\n");
  
  process.exit();
}

runTest();
