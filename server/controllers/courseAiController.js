const { createCourseOutline } = require("../services/courseGeneration");
const { saveGeneratedCourse } = require("../services/coursePersistence");

async function generateCourseContent(req, res) {
  const prompt = String(req.body?.prompt || "").trim().slice(0, 2000);

  if (prompt.length < 10) {
    return res.status(400).json({ error: "Describe the course in at least 10 characters" });
  }

  const outline = await createCourseOutline(prompt);
  const course = await saveGeneratedCourse(outline, req.user._id);

  return res.status(201).json(course);
}

module.exports = {
  generateCourseContent,
};
