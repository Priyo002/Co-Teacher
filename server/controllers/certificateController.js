const Certificate = require("../models/Certificate");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const Module = require("../models/Module");
const User = require("../models/User");

async function claimCertificate(req, res) {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Verify course exists and belongs to user
    const course = await Course.findOne({ _id: courseId, creator: userId });
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Ensure final test has been generated
    if (!course.finalTest || !course.finalTest.questions || course.finalTest.questions.length === 0) {
      return res.status(400).json({ error: "Final test has not been generated for this course yet." });
    }

    const { answers } = req.body; // Array of selected option indices
    if (!Array.isArray(answers) || answers.length !== course.finalTest.questions.length) {
      return res.status(400).json({ error: "Invalid answers submitted." });
    }

    // Calculate score
    let correctCount = 0;
    const totalQuestions = course.finalTest.questions.length;

    course.finalTest.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / totalQuestions) * 100);

    if (percentage < 70) {
      return res.json({
        passed: false,
        averageScore: percentage,
        message: "Average score must be at least 70% to claim a certificate."
      });
    }

    // Check if certificate already exists
    let certificate = await Certificate.findOne({ user: userId, course: courseId });
    
    if (!certificate) {
      // Create new certificate
      const user = await User.findById(userId);
      certificate = await Certificate.create({
        user: userId,
        userName: user.name || user.email.split('@')[0], // Fallback to email prefix if no name
        course: courseId,
        courseTitle: course.title,
        averageScore: percentage
      });
    } else {
      // Update score if it improved
      if (percentage > certificate.averageScore) {
        certificate.averageScore = percentage;
        await certificate.save();
      }
    }

    res.json({
      passed: true,
      certificateId: certificate.certificateId,
      averageScore: percentage
    });
  } catch (error) {
    console.error("Error claiming certificate:", error);
    res.status(500).json({ error: "Failed to claim certificate" });
  }
}

async function getCertificate(req, res) {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findOne({ certificateId });
    
    if (!certificate) return res.status(404).json({ error: "Certificate not found" });

    res.json(certificate);
  } catch (error) {
    console.error("Error fetching certificate:", error);
    res.status(500).json({ error: "Failed to fetch certificate" });
  }
}

module.exports = {
  claimCertificate,
  getCertificate
};
