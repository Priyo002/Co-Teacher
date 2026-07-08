require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');
const Course = require('./models/Course');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const course = await Course.findOne().sort({ createdAt: -1 });
  console.log('Most recent course:', course.title);

  const lessons = await Lesson.find({ generationStatus: 'complete' }).sort({ createdAt: -1 }).limit(10);
  for (const lesson of lessons) {
    console.log(`Lesson: ${lesson.title}, content length: ${lesson.content ? lesson.content.length : 'null'}, isEnriched: ${lesson.isEnriched}`);
    if (lesson.content && lesson.content.length > 0 && lesson.content.length < 5) {
       console.log('Content snippet:', JSON.stringify(lesson.content).slice(0, 100));
    }
  }

  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
