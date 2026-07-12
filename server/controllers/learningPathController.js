const LearningPath = require("../models/LearningPath");
const { createLearningPathOutline } = require("../services/courseGeneration");
const { saveGeneratedCourse } = require("../services/coursePersistence");
const { createCourseOutline } = require("../services/courseGeneration");
const CreditHistory = require("../models/CreditHistory");
const Course = require("../models/Course");

async function generateLearningPath(req, res) {
  try {
    const goal = String(req.body?.goal || "").trim().slice(0, 2000);
    const language = String(req.body?.language || "English").trim().slice(0, 80);

    if (goal.length < 3) {
      return res.status(400).json({ error: "Describe the career or learning goal in at least 3 characters" });
    }

    const user = req.user;
    if (user.credits < 50) {
      return res.status(403).json({ 
        error: "Insufficient credits. Generating a Learning Path roadmap costs 50 credits." 
      });
    }

    const personalization = {
      educationLevel: user.educationLevel,
      fieldOfStudy: user.fieldOfStudy,
      learningStyle: user.learningStyle
    };

    const coursesOutline = await createLearningPathOutline(goal, language, personalization);
    
    const learningPath = await LearningPath.create({
      goal,
      creator: user._id,
      courses: coursesOutline
    });

    user.credits -= 50;
    await user.save();

    await CreditHistory.create({
      user: user._id,
      amount: -50,
      reason: `Learning Path Generation: ${goal}`
    });

    return res.status(201).json(learningPath);
  } catch (error) {
    console.error("Generate Learning Path Error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to generate learning path" });
  }
}

async function getLearningPaths(req, res) {
  try {
    const paths = await LearningPath.find({ creator: req.user._id }).sort({ createdAt: -1 });
    res.json(paths);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch learning paths" });
  }
}

async function getLearningPathById(req, res) {
  try {
    const path = await LearningPath.findOne({ _id: req.params.id, creator: req.user._id }).populate('courses.courseId');
    if (!path) return res.status(404).json({ error: "Learning path not found" });
    res.json(path);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch learning path" });
  }
}

async function deleteLearningPath(req, res) {
  try {
    const path = await LearningPath.findOneAndDelete({ _id: req.params.id, creator: req.user._id });
    if (!path) return res.status(404).json({ error: "Learning path not found" });
    res.json({ message: "Learning path deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete learning path" });
  }
}

async function generatePathCourse(req, res) {
  try {
    const { id, courseIndex } = req.params;
    const path = await LearningPath.findOne({ _id: id, creator: req.user._id });
    if (!path) return res.status(404).json({ error: "Learning path not found" });

    const courseNode = path.courses[courseIndex];
    if (!courseNode) return res.status(404).json({ error: "Course node not found in path" });

    if (courseNode.courseId) {
      return res.status(400).json({ error: "This course has already been generated" });
    }

    const user = req.user;
    if (user.credits < 100) {
      return res.status(403).json({ error: "Insufficient credits. Generating a course costs 100 credits." });
    }

    const personalization = {
      educationLevel: user.educationLevel,
      fieldOfStudy: user.fieldOfStudy,
      learningStyle: user.learningStyle
    };

    // Use standard course outline generator, but seed it with the roadmap details
    const prompt = `Topic: ${courseNode.title}. Description: ${courseNode.description}. Prerequisites: ${courseNode.prerequisites.join(', ')}. Context: This is course ${parseInt(courseIndex) + 1} in a learning path to achieve this goal: ${path.goal}`;
    
    const difficulty = courseNode.difficulty || "Beginner";
    const outline = await createCourseOutline(prompt, "English", personalization, difficulty);
    const course = await saveGeneratedCourse(outline, req.user._id, "English");

    courseNode.courseId = course._id;
    await path.save();

    user.credits -= 100;
    await user.save();

    await CreditHistory.create({
      user: user._id,
      amount: -100,
      reason: `Path Course Generation: ${course.title}`
    });

    return res.status(201).json({ path, courseId: course._id });
  } catch (error) {
    console.error("Generate Path Course Error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to generate path course" });
  }
}

module.exports = {
  generateLearningPath,
  getLearningPaths,
  getLearningPathById,
  deleteLearningPath,
  generatePathCourse
};
