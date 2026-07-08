const Course = require("../models/Course");
const { sendEmail } = require("./emailService");

async function checkAndSendCourseCompletionEmail(courseId, user) {
  try {
    const course = await Course.findById(courseId).populate({
      path: "modules",
      populate: { path: "lessons" }
    });

    if (!course) return;
    if (course.completedEmailSent) return; // Email already sent for this course

    // Check if ALL lessons in ALL modules are completed
    let isFullyCompleted = true;
    let totalLessons = 0;

    for (const module of course.modules) {
      if (!module.lessons || module.lessons.length === 0) continue;
      
      for (const lesson of module.lessons) {
        totalLessons++;
        if (!lesson.completedAt) {
          isFullyCompleted = false;
          break;
        }
      }
      if (!isFullyCompleted) break;
    }

    // Don't send if the course is totally empty
    if (totalLessons === 0) return;

    if (isFullyCompleted) {
      // Mark as sent in DB
      course.completedEmailSent = true;
      await course.save();

      // Send the email
      if (user.email) {
        const dashboardUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        sendEmail({
          to: user.email,
          subject: "🎉 Congratulations on finishing your course!",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; text-align: center; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px;">
              <h1 style="color: #4F46E5; font-size: 28px;">You did it, ${user.name || 'Student'}! 🎓</h1>
              <p style="font-size: 18px; line-height: 1.6;">You have successfully completed every single lesson in <strong>"${course.title}"</strong>.</p>
              
              <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin: 30px 0; text-align: left;">
                <h3 style="margin-top: 0; color: #1e293b;">What's next?</h3>
                <p style="color: #475569;">Consistent learning is the key to mastering any subject. We've got plenty of credits waiting for you to spark your next big idea.</p>
                <div style="text-align: center; margin-top: 24px;">
                  <a href="${dashboardUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Generate Next Course</a>
                </div>
              </div>
              
              <p style="color: #64748b;">We are incredibly proud of your progress.</p>
              <p style="color: #64748b; margin-top: 24px;">Keep up the great work,<br/><strong>The Co-Teacher Team</strong></p>
            </div>
          `
        });
      }
    }
  } catch (error) {
    console.error("Error in checkAndSendCourseCompletionEmail:", error);
  }
}

module.exports = {
  checkAndSendCourseCompletionEmail
};
