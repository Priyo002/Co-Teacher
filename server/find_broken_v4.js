require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const lesson = await Lesson.findOne({ title: /Input\/Output Devices/i });
  if (lesson) {
    console.log(`Title: ${lesson.title}`);
    console.log(`generationStatus: ${lesson.generationStatus}`);
    console.log(`isEnriched: ${lesson.isEnriched}`);
    console.log(`Content length: ${lesson.content ? lesson.content.length : 0}`);
  }

  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
