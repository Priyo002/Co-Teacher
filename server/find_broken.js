require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const lesson = await Lesson.findOne({ title: 'Importance of Input/Output Devices' });
  console.log('Lesson:', lesson);
  console.log('Content JSON:', JSON.stringify(lesson.content, null, 2));

  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
