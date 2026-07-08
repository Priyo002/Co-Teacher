require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const emptyLessons = await Lesson.find({ generationStatus: 'complete' });
  let count = 0;
  
  for (const lesson of emptyLessons) {
    let reset = false;
    if (!lesson.content) {
      reset = true;
    } else if (Array.isArray(lesson.content)) {
      if (lesson.content.length === 0) {
         reset = true;
      } else {
         // Check if there's any text in it
         const hasText = lesson.content.some(b => b && (b.text || (b.items && b.items.length > 0)));
         if (!hasText) reset = true;
      }
    }
    
    if (reset) {
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
