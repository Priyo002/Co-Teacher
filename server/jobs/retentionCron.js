const cron = require('node-cron');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

function startRetentionCron() {
  // Run every day at 12:00 PM server time
  cron.schedule('0 12 * * *', async () => {
    console.log('[CRON] Running daily retention job...');
    
    try {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Find users who:
      // 1. Have completed onboarding
      // 2. Haven't been active in 2 days
      // 3. Haven't received a retention email in the last 7 days (or ever)
      const inactiveUsers = await User.find({
        hasCompletedOnboarding: true,
        lastActiveAt: { $lt: twoDaysAgo },
        $or: [
          { lastRetentionEmailDate: { $exists: false } },
          { lastRetentionEmailDate: null },
          { lastRetentionEmailDate: { $lt: sevenDaysAgo } }
        ]
      });

      console.log(`[CRON] Found ${inactiveUsers.length} inactive users.`);

      const dashboardUrl = process.env.CLIENT_URL || 'http://localhost:5173';

      for (const user of inactiveUsers) {
        if (!user.email) continue;

        const sent = await sendEmail({
          to: user.email,
          subject: "👋 We miss you at Co-Teacher!",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; text-align: center; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px;">
              <h1 style="color: #4F46E5; font-size: 28px;">It's been a minute, ${user.name || 'Student'}!</h1>
              <p style="font-size: 18px; line-height: 1.6;">Your learning journey is waiting. Why not jump back in and generate a quick lesson on a topic you're curious about?</p>
              
              <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin: 30px 0; text-align: left;">
                <h3 style="margin-top: 0; color: #1e293b;">Spark your next idea</h3>
                <p style="color: #475569;">You still have <strong>${user.credits} credits</strong> remaining in your account. That's plenty to explore something entirely new.</p>
                <div style="text-align: center; margin-top: 24px;">
                  <a href="${dashboardUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Jump Back In</a>
                </div>
              </div>
            </div>
          `
        });

        if (sent) {
          user.lastRetentionEmailDate = new Date();
          await user.save();
        }
      }
    } catch (error) {
      console.error('[CRON] Retention job failed:', error);
    }
  });
}

module.exports = startRetentionCron;
