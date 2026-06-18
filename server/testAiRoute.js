require('dotenv').config();
const aiRouter = require('./services/aiRouter');

async function test() {
  const systemPrompt = `You are an expert educator. Generate a JSON array of multiple-choice questions. Do not output anything else.
Format each item exactly like this:
[
  {
    "question": "What is the primary function of...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 1,
    "explanation": "Option B is correct because..."
  }
]`;

  const prompt = `Generate exactly 5 multiple-choice questions for the following module from the course "Theory of Computation".

Module 1: Automata Theory
- Lesson: Finite Automata
- Lesson: Pushdown Automata

The difficulty should reflect the advanced topics in the module.`;

  try {
    const mcqs = await aiRouter.generateJson(systemPrompt, prompt, 4000);
    console.log("Is array?", Array.isArray(mcqs));
    console.log("Length:", mcqs.length);
    console.log(mcqs);
  } catch (err) {
    console.error("AI Error:", err);
  }
  process.exit(0);
}

test();
