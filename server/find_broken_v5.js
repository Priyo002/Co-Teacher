require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const lessons = await Lesson.find({ title: /Input\/Output Devices/i });
  console.log(`Found ${lessons.length} lessons`);
  for (const lesson of lessons) {
    console.log(`- ID: ${lesson._id}, Title: ${lesson.title}, Status: ${lesson.generationStatus}, isEnriched: ${lesson.isEnriched}, Content length: ${lesson.content ? lesson.content.length : 0}`);
  }

  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
