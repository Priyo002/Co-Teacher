const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Course = require('./models/Course');
const Module = require('./models/Module');
const Lesson = require('./models/Lesson');

async function migrateScores() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Reset all users' scores
    await User.updateMany({}, { $set: { globalScore: 0, totalTestsTaken: 0 } });
    console.log('Reset all user scores to 0');

    const users = await User.find({});
    
    for (const user of users) {
      let globalScore = 0;
      let totalTestsTaken = 0;

      const courses = await Course.find({ creator: user._id });

      for (const course of courses) {
        // Final Test
        if (course.finalTest && course.finalTest.attempts && course.finalTest.attempts.length > 0) {
          const firstAttempt = course.finalTest.attempts[0];
          const score = Math.round(100 * (firstAttempt.score / 100) * (firstAttempt.passed ? 1.5 : 1.0));
          globalScore += score;
          totalTestsTaken += 1;
        }

        // Lessons
        const modules = await Module.find({ course: course._id });
        for (const mod of modules) {
          const lessons = await Lesson.find({ module: mod._id });
          for (const lesson of lessons) {
            if (lesson.testAttempts && lesson.testAttempts.length > 0) {
              const firstAttempt = lesson.testAttempts[0];
              const score = Math.round(20 * (firstAttempt.score / 100) * (firstAttempt.passed ? 1.5 : 1.0));
              globalScore += score;
              totalTestsTaken += 1;
            }
          }
        }
      }

      if (totalTestsTaken > 0) {
        user.globalScore = globalScore;
        user.totalTestsTaken = totalTestsTaken;
        await user.save();
        console.log(`Updated user ${user.name}: Score ${globalScore}, Tests ${totalTestsTaken}`);
      }
    }

    console.log('Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateScores();
