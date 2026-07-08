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

    const { answers, cheated, navigatedAway } = req.body; // Array of selected option indices
    if (!Array.isArray(answers) || answers.length !== course.finalTest.questions.length) {
      return res.status(400).json({ error: "Invalid answers submitted." });
    }

    if (course.finalTest.attempts && course.finalTest.attempts.length >= 3) {
      return res.status(400).json({ error: "Maximum 3 attempts reached." });
    }

    // Calculate score
    let correctCount = 0;
    const totalQuestions = course.finalTest.questions.length;

    course.finalTest.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    let percentage = Math.round((correctCount / totalQuestions) * 100);

    if (cheated || navigatedAway) {
      percentage = 0;
      correctCount = 0;
    }

    const passed = percentage >= 70;

    const isFirstAttempt = !course.finalTest.attempts || course.finalTest.attempts.length === 0;
    let creditsEarned = 0;
    let magicScoreEarned = 0;

    if (isFirstAttempt) {
      // Calculate Magic Score for Final Test
      magicScoreEarned = Math.round(100 * (percentage / 100) * (passed ? 1.5 : 1.0));
      req.user.globalScore = (req.user.globalScore || 0) + magicScoreEarned;
      req.user.totalTestsTaken = (req.user.totalTestsTaken || 0) + 1;

      if (passed && !cheated && !navigatedAway) {
        req.user.credits = (req.user.credits || 0) + 15;
        creditsEarned = 15;
        const CreditHistory = require("../models/CreditHistory");
        await CreditHistory.create({
          user: req.user._id,
          amount: 15,
          reason: `Passed Final Test on First Attempt: ${course.title}`
        });
      }

      await req.user.save();
    }

    if (!course.finalTest.attempts) {
      course.finalTest.attempts = [];
    }

    course.finalTest.attempts.push({
      score: percentage,
      passed,
      date: new Date(),
      answers: answers.map(String)
    });

    await course.save();

    if (!passed) {
      return res.json({
        passed: false,
        averageScore: percentage,
        attemptsCount: course.finalTest.attempts.length,
        isMaxAttempts: course.finalTest.attempts.length >= 3,
        message: "Score must be at least 70% to claim a certificate."
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
      averageScore: percentage,
      attemptsCount: course.finalTest.attempts.length,
      isMaxAttempts: course.finalTest.attempts.length >= 3,
      creditsEarned
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
