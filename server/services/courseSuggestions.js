const { generateJson } = require("./aiRouter");

async function generateCourseSuggestions(user, existingCourses) {
  let userContext = "";
  if (user.educationLevel || user.fieldOfStudy || (user.learningStyle && user.learningStyle.length > 0) || user.learningGoal) {
    userContext += "TAILOR THE SUGGESTIONS FOR THIS SPECIFIC USER:\n";
    if (user.educationLevel) userContext += `- Education Level: ${user.educationLevel}\n`;
    if (user.fieldOfStudy) userContext += `- Field of Study/Industry: ${user.fieldOfStudy}\n`;
    if (user.learningStyle && user.learningStyle.length > 0) {
      userContext += `- Learning Style Preferences: ${user.learningStyle.join(', ')}\n`;
    }
    if (user.learningGoal) userContext += `- Primary Goal: ${user.learningGoal}\n`;
  }

  if (existingCourses && existingCourses.length > 0) {
    const courseTitles = existingCourses.slice(0, 10).map(c => c.title).join(", ");
    userContext += `\nThe user has already taken or generated these courses: ${courseTitles}. DO NOT suggest these again. Build upon them or suggest completely new areas related to their goal.\n`;
  }

  const instructions = `
You are an expert AI educational counselor. Based on the user profile, suggest 4 highly engaging, practical, and tailored course titles that the user would love to learn.

${userContext}

Return JSON EXACTLY in this format:
[
  {
    "title": "A catchy, highly specific course title (e.g., 'Python for Financial Analysis')",
    "description": "A 1-2 sentence hook describing what they will learn and why it's valuable.",
    "difficulty": "Beginner | Intermediate | Advanced"
  }
]

CRITICAL: Return exactly 4 suggestions.
  `.trim();

  let suggestions = await generateJson(instructions, "Generate course suggestions.", 2000);
  
  if (suggestions && !Array.isArray(suggestions)) {
    if (Array.isArray(suggestions.suggestions)) suggestions = suggestions.suggestions;
    else if (Array.isArray(suggestions.courses)) suggestions = suggestions.courses;
    else if (Array.isArray(suggestions.data)) suggestions = suggestions.data;
  }

  if (!Array.isArray(suggestions)) {
    throw new Error("Failed to generate course suggestions.");
  }

  return suggestions.slice(0, 4).map(s => ({
    title: String(s.title).trim(),
    description: String(s.description).trim(),
    difficulty: String(s.difficulty).trim() || "Beginner"
  }));
}

module.exports = { generateCourseSuggestions };
