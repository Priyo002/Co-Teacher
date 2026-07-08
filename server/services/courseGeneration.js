const { generateJson } = require("./aiRouter");

function formatCourse(result) {
  if (result.rejectedReason) {
    const error = new Error(result.rejectedReason);
    error.statusCode = 400;
    throw error;
  }

  const sourceModules = Array.isArray(result.modules) ? result.modules : [];
  const modules = sourceModules.slice(0, 10).map((module) => {
    if (!module || typeof module !== "object") return null;

    const lessons = (Array.isArray(module.lessons) ? module.lessons : [])
      .slice(0, 10)
      .map((lesson) => ({
        title: String(typeof lesson === "string" ? lesson : lesson?.title || "")
          .trim()
          .slice(0, 160),
      }))
      .filter((lesson) => lesson.title);

    return {
      title: String(module.title || "").trim().slice(0, 160),
      lessons,
    };
  }).filter((module) => module?.title && module.lessons.length);

  const course = {
    title: String(result.title || "").trim().slice(0, 160),
    description: String(result.description || "").trim().slice(0, 600),
    modules,
  };

  if (!course.title || !course.modules.length) {
    const error = new Error("AI returned an incomplete course outline. Please try again.");
    error.statusCode = 502;
    throw error;
  }

  return course;
}

async function createCourseOutline(prompt, language = "English", personalization = {}, level = "Beginner") {
  let userContext = `THIS COURSE MUST BE GENERATED FOR A ${level.toUpperCase()} LEVEL AUDIENCE.\n`;
  if (personalization.educationLevel || personalization.fieldOfStudy || (personalization.learningStyle && personalization.learningStyle.length > 0) || personalization.learningGoal) {
    userContext += "TAILOR THE COURSE FOR THIS SPECIFIC USER:\n";
    if (personalization.educationLevel) userContext += `- Education Level: ${personalization.educationLevel}\n`;
    if (personalization.fieldOfStudy) userContext += `- Field of Study/Industry: ${personalization.fieldOfStudy}\n`;
    if (personalization.learningStyle && personalization.learningStyle.length > 0) {
      userContext += `- Learning Style Preferences: ${personalization.learningStyle.join(', ')}\n`;
    }
    if (personalization.learningGoal) userContext += `- Primary Goal: ${personalization.learningGoal}\n`;
    userContext += "Adapt the curriculum difficulty, analogies, and pacing to perfectly match this user profile.\n\n";
  }

  const instructions = `
Create a practical course outline.
Return JSON with "title", "description", and "modules".
Create 5-10 modules depending on the course topic. Each module needs a "title" and a "lessons" array.
Each lesson must be an object with a "title".
Do not include lesson content, quizzes, or videos.
${userContext}The entire course outline MUST be generated completely in this language: ${language}.
CRITICAL INSTRUCTION: If the requested topic is inappropriate, unsafe, promotes violence/illegal acts (e.g. "how to make a bomb"), or is complete gibberish (e.g. "adadfasdfasdfs"), DO NOT generate a course. Instead, return a JSON object with exactly one property: { "rejectedReason": "A polite, user-friendly message explaining why this topic cannot be generated." }.
  `.trim();

  const result = await generateJson(instructions, prompt, 8192);
  return formatCourse(result);
}

async function generatePreAssessmentQuestions(prompt, targetLevel, language = "English") {
  let instructions = "";
  if (targetLevel === "Auto-detect") {
    instructions = `
You are an expert educator. The user wants to learn about the following topic.
You must generate a 5-question multiple-choice diagnostic pre-assessment quiz that tests their knowledge of the topic.
Include 2 Beginner level questions, 2 Intermediate level questions, and 1 Advanced level question.
`;
  } else {
    const prerequisiteLevel = targetLevel === "Advanced" ? "Intermediate" : "Beginner";
    instructions = `
You are an expert educator. The user wants to learn about the following topic at an ${targetLevel} level.
To ensure they are ready, you must generate a 5-question multiple-choice pre-assessment quiz that tests their knowledge of the PRE-REQUISITE ${prerequisiteLevel} level concepts for this topic.
`;
  }

  instructions += `
Return JSON EXACTLY in this format:
[
  {
    "question": "What is the primary function of...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 1,
    "explanation": "Option B is correct because..."
  }
]

CRITICAL: Return exactly 5 questions. The correct answer must be an integer index (0-3).
All questions and explanations MUST be completely in this language: ${language}.
  `.trim();

  let mcqs = await generateJson(instructions, prompt, 4000);
  
  if (mcqs && !Array.isArray(mcqs)) {
    if (Array.isArray(mcqs.questions)) mcqs = mcqs.questions;
    else if (Array.isArray(mcqs.mcqs)) mcqs = mcqs.mcqs;
    else if (Array.isArray(mcqs.data)) mcqs = mcqs.data;
  }
  
  if (!Array.isArray(mcqs)) {
    throw new Error("Failed to generate pre-assessment questions.");
  }

  return mcqs.slice(0, 5).map(q => ({
    question: String(q.question).trim() || "Question",
    options: Array.isArray(q.options) ? q.options.map(opt => String(opt || "").trim()) : [],
    correctAnswer: Number(q.correctAnswer) || 0,
    explanation: String(q.explanation || "No explanation provided.").trim()
  }));
}

module.exports = { createCourseOutline, generatePreAssessmentQuestions };
