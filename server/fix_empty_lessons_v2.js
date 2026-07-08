require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const allCompleteLessons = await Lesson.find({ generationStatus: 'complete' });
  let count = 0;
  
  for (const lesson of allCompleteLessons) {
    if (!lesson.content || lesson.content.length === 0 || (lesson.content.length === 1 && !lesson.content[0].text)) {
      lesson.generationStatus = 'none';
      lesson.isEnriched = false;
      lesson.currentChunkIndex = 0;
      lesson.outline = [];
      lesson.testQuestions = [];
      await lesson.save();
      console.log(`Reset empty lesson: ${lesson.title}`);
      count++;
    }
  }

  console.log(`Done. Reset ${count} lessons.`);
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
