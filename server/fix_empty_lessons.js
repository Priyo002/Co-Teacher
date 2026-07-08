require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const emptyLessons = await Lesson.find({ generationStatus: 'complete', content: { $size: 0 } });
  
  for (const lesson of emptyLessons) {
    lesson.generationStatus = 'none';
    lesson.isEnriched = false;
    lesson.currentChunkIndex = 0;
    lesson.outline = [];
    lesson.testQuestions = [];
    await lesson.save();
    console.log(`Reset empty lesson: ${lesson.title}`);
  }

  console.log('Done');
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
