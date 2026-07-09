const { generateJson } = require("./aiRouter");

function getPredefinedSuggestions(level) {
  const normalizedLevel = (level || "").toLowerCase();
  
  if (normalizedLevel.includes("high school")) {
    return [
      { title: "College Prep Basics", description: "Master the essential skills needed to transition successfully into college life.", difficulty: "Beginner" },
      { title: "Teen Finance 101", description: "Learn how to manage money, budget, and understand credit before graduation.", difficulty: "Beginner" },
      { title: "Effective Study Habits", description: "Discover science-backed techniques to learn faster and retain more information.", difficulty: "Beginner" },
      { title: "Intro to Coding for Teens", description: "A fun, project-based introduction to computer programming.", difficulty: "Beginner" }
    ];
  }
  
  if (normalizedLevel.includes("professional")) {
    return [
      { title: "Effective Communication at Work", description: "Enhance your professional communication to lead and collaborate better.", difficulty: "Intermediate" },
      { title: "Time Management Pro", description: "Learn frameworks to maximize productivity and eliminate burnout.", difficulty: "Intermediate" },
      { title: "Data Analysis for Business", description: "Leverage data to make informed, strategic decisions in any role.", difficulty: "Intermediate" },
      { title: "Leadership Fundamentals", description: "Develop the core skills needed to manage teams and drive results.", difficulty: "Beginner" }
    ];
  }
  
  if (normalizedLevel.includes("hobbyist")) {
    return [
      { title: "Digital Photography Masterclass", description: "Take stunning photos using just your smartphone or a beginner DSLR.", difficulty: "Beginner" },
      { title: "Creative Writing Workshop", description: "Unlock your imagination and learn the fundamentals of storytelling.", difficulty: "Beginner" },
      { title: "Introduction to Gardening", description: "Learn how to grow your own food and beautiful plants at home.", difficulty: "Beginner" },
      { title: "Basic Graphic Design", description: "Create beautiful visuals for personal projects using modern tools.", difficulty: "Beginner" }
    ];
  }
  
  // Default (College or unknown)
  return [
    { title: "Career Planning & Networking", description: "Build a professional network and plan your career trajectory early.", difficulty: "Beginner" },
    { title: "Advanced Research Methods", description: "Learn how to find, analyze, and synthesize complex information.", difficulty: "Intermediate" },
    { title: "Personal Finance for Young Adults", description: "Master budgeting, investing, and student loans.", difficulty: "Beginner" },
    { title: "Public Speaking & Presentations", description: "Overcome stage fright and deliver compelling presentations.", difficulty: "Beginner" }
  ];
}

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

  const isMeaningful = (text) => text && text.trim().length >= 3 && /[a-zA-Z0-9]/.test(text);
  const isWeakProfile = !isMeaningful(user.fieldOfStudy) && !isMeaningful(user.learningGoal);
  
  if (isWeakProfile && (!existingCourses || existingCourses.length === 0)) {
    return getPredefinedSuggestions(user.educationLevel);
  }

  let suggestions;
  try {
    suggestions = await generateJson(instructions, "Generate course suggestions.", 2000);
    
    if (suggestions && !Array.isArray(suggestions)) {
      if (Array.isArray(suggestions.suggestions)) suggestions = suggestions.suggestions;
      else if (Array.isArray(suggestions.courses)) suggestions = suggestions.courses;
      else if (Array.isArray(suggestions.data)) suggestions = suggestions.data;
    }

    if (!Array.isArray(suggestions)) {
      throw new Error("Failed to generate course suggestions.");
    }
    
    // Validate we actually got good data
    if (suggestions.length === 0 || !suggestions[0].title) {
      throw new Error("AI returned empty or malformed suggestions");
    }
  } catch (err) {
    console.warn("AI generation for suggestions failed, falling back to predefined list:", err.message);
    return getPredefinedSuggestions(user.educationLevel);
  }

  return suggestions.slice(0, 4).map(s => {
    const title = s.title || s.Title || s.courseName || s.name || "Untitled Course";
    const desc = s.description || s.Description || s.summary || s.Summary || "A great course tailored just for you.";
    const diff = s.difficulty || s.Difficulty || s.level || "Beginner";
    
    return {
      title: String(title).trim(),
      description: String(desc).trim(),
      difficulty: String(diff).trim()
    };
  });
}

module.exports = { generateCourseSuggestions };
