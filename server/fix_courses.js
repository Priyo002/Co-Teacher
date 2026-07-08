require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Course = require('./models/Course');
const Module = require('./models/Module');
const Lesson = require('./models/Lesson');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const courses = await Course.find().populate('modules');
  for (const course of courses) {
    if (course.modules && course.modules.length > 0) {
      const firstModuleId = course.modules[0]._id;
      const firstModule = await Module.findById(firstModuleId).populate('lessons');
      if (firstModule && firstModule.lessons && firstModule.lessons.length > 0) {
        const firstLessonId = firstModule.lessons[0]._id;
        await Lesson.findByIdAndUpdate(firstLessonId, { isUnlocked: true });
        console.log(`Unlocked first lesson for course: ${course.title}`);
      }
    }
  }

  console.log('Done');
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
