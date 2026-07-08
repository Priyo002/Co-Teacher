require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const lesson = await Lesson.findOne({ title: /Input\/Output Devices/i });
  if (lesson) {
    console.log(`Found: ${lesson.title}`);
    console.log(`Length: ${lesson.content ? lesson.content.length : 0}`);
    console.log(JSON.stringify(lesson.content, null, 2));
  } else {
    console.log('Not found');
  }

  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
