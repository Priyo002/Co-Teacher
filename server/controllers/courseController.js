const crypto = require("crypto");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const { deleteCourseRecords } = require("../services/coursePersistence");
const { getOwnedLesson } = require("../services/lessonAccessService");
const { checkAndSendCourseCompletionEmail } = require("../services/courseCompletionService");
const aiRouter = require("../services/aiRouter");
const Certificate = require("../models/Certificate");
const { createLessonContent } = require("../services/lessonGeneration");
const { findLessonVideos } = require("../services/youtubeService");
const { createLessonQuiz } = require("../services/studyGeneration");

const COURSE_OUTLINE = {
  path: "modules",
  select: "title lessons",
  populate: {
    path: "lessons",
    select: "title isEnriched completedAt bookmarked lastOpenedAt quizBestScore quizAttempts isUnlocked isPassed testAttempts generationStatus",
  },
};

function ownsCourse(course, userId) {
  return String(course.creator) === String(userId);
}

async function getMyCourses(req, res) {
  const courses = await Course.find({ creator: req.user._id })
    .select("title description modules isPublic shareId createdAt")
    .sort({ createdAt: -1 })
    .populate(COURSE_OUTLINE)
    .lean();

  return res.json(courses);
}

async function getCourseById(req, res) {
  const course = await Course.findById(req.params.courseId)
    .select("title description modules isPublic shareId creator finalTest")
    .populate(COURSE_OUTLINE)
    .lean();

  if (!course) return res.status(404).json({ error: "Course not found" });
  if (!ownsCourse(course, req.user._id)) return res.status(403).json({ error: "Forbidden" });

  const certificate = await Certificate.findOne({ course: course._id, user: req.user._id }).lean();
  if (certificate) {
    course.earnedCertificateId = certificate.certificateId;
  }

  delete course.creator;
  return res.json(course);
}

async function getLessonView(req, res) {
  const context = await getOwnedLesson(req.params.lessonId, req.user._id);
  if (String(context.course._id) !== String(req.params.courseId)) {
    return res.status(404).json({ error: "Lesson not found in this course" });
  }

  // Automatically update lastOpenedAt when the lesson is viewed
  context.lesson.lastOpenedAt = new Date();
  await context.lesson.save();

  const course = await Course.findById(req.params.courseId)
    .select("title description modules")
    .populate(COURSE_OUTLINE)
    .lean();

  return res.json({
    course,
    lesson: context.lesson.toObject({ depopulate: true }),
  });
}

async function deleteCourse(req, res) {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ error: "Course not found" });
  if (!ownsCourse(course, req.user._id)) return res.status(403).json({ error: "Forbidden" });

  await deleteCourseRecords(course);

  return res.json({ message: "Course deleted" });
}

async function updateLessonProgress(req, res) {
  const { lesson, course } = await getOwnedLesson(req.params.lessonId, req.user._id);

  if (req.body?.opened === true) lesson.lastOpenedAt = new Date();
  if (typeof req.body?.completed === "boolean") {
    lesson.completedAt = req.body.completed ? new Date() : null;
  }
  if (typeof req.body?.bookmarked === "boolean") {
    lesson.bookmarked = req.body.bookmarked;
  }
  if (typeof req.body?.notes === "string") {
    lesson.notes = req.body.notes.slice(0, 12000);
  }
  if (typeof req.body?.quizBestScore === "number") {
    lesson.quizBestScore = Math.max(lesson.quizBestScore, req.body.quizBestScore);
  }
  if (typeof req.body?.quizAttempts === "number") {
    lesson.quizAttempts += req.body.quizAttempts;
  }

  await lesson.save();

  if (req.body?.completed === true && course) {
    checkAndSendCourseCompletionEmail(course._id, req.user);
  }

  return res.json(lesson.toObject({ depopulate: true }));
}

async function updateSharing(req, res) {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ error: "Course not found" });
  if (!ownsCourse(course, req.user._id)) return res.status(403).json({ error: "Forbidden" });

  course.isPublic = req.body?.enabled === true;
  if (course.isPublic && !course.shareId) course.shareId = crypto.randomUUID();
  await course.save();

  return res.json({ isPublic: course.isPublic, shareId: course.shareId });
}

async function getPublicCourse(req, res) {
  const course = await Course.findOne({
    shareId: req.params.shareId,
    isPublic: true,
  })
    .select("title description modules updatedAt")
    .populate({
      path: "modules",
      select: "title lessons",
      populate: {
        path: "lessons",
        select: "title content language isEnriched isUnlocked isPassed generationStatus",
      },
    })
    .lean();

  if (!course) return res.status(404).json({ error: "Shared course not found" });
  return res.json(course);
}

async function generateFinalTest(req, res) {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate({
        path: "modules",
        populate: { path: "lessons" }
      });

    if (!course) return res.status(404).json({ error: "Course not found" });
    if (!ownsCourse(course, req.user._id)) return res.status(403).json({ error: "Forbidden" });

    if (course.finalTest && course.finalTest.questions && course.finalTest.questions.length > 0) {
      return res.json({ message: "Test already generated", finalTest: course.finalTest });
    }

    const totalLessonsInCourse = course.modules.reduce((sum, mod) => sum + (mod.lessons?.length || 0), 0);
    const TARGET_TOTAL_QUESTIONS = 25;

    const modulePromises = course.modules.map(async (mod, idx) => {
      const lessonCount = mod.lessons?.length || 0;
      if (lessonCount === 0) return [];

      // Weight questions by number of lessons in the module
      let numQuestions = Math.round((lessonCount / totalLessonsInCourse) * TARGET_TOTAL_QUESTIONS);
      if (numQuestions < 2) numQuestions = 2; // At least 2 questions per module

      let moduleSyllabus = `Module ${idx + 1}: ${mod.title}\n`;
      mod.lessons.forEach(l => {
        moduleSyllabus += `- Lesson: ${l.title} (Covers: ${l.description || 'General concepts'})\n`;
      });

      const prompt = `Generate exactly ${numQuestions} multiple-choice questions for the following module from the course "${course.title}".\n\n${moduleSyllabus}\n\nThe difficulty should reflect the advanced topics in the module.`;

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

      try {
        let mcqs = await aiRouter.generateJson(systemPrompt, prompt, 4000);
        
        // Handle cases where the AI wraps the array in an object (e.g. { "questions": [...] })
        if (mcqs && !Array.isArray(mcqs)) {
          if (Array.isArray(mcqs.questions)) mcqs = mcqs.questions;
          else if (Array.isArray(mcqs.mcqs)) mcqs = mcqs.mcqs;
          else if (Array.isArray(mcqs.data)) mcqs = mcqs.data;
        }
        
        if (!Array.isArray(mcqs)) return [];

        return mcqs
          .filter(q => {
            if (!q || typeof q.question !== 'string' || !Array.isArray(q.options)) return false;
            const ans = Number(q.correctAnswer);
            const validOptionsCount = q.options.filter(opt => String(opt || "").trim()).length;
            return !isNaN(ans) && ans >= 0 && ans < validOptionsCount;
          })
          .map(q => {
            const rawOptions = q.options.map(opt => String(opt || "").trim()).filter(Boolean);
            let correctAnswer = Number(q.correctAnswer);

            const options = [];
            for (let i = 0; i < 4; i++) {
              if (i < rawOptions.length) {
                options.push(rawOptions[i]);
              } else {
                options.push("None of the above");
              }
            }

            // If the correct answer is beyond the 4th option, we MUST preserve it
            // by swapping it into the visible 4 options before truncating.
            if (correctAnswer > 3) {
              options[3] = rawOptions[correctAnswer];
              correctAnswer = 3;
            }

            return {
              question: String(q.question).trim() || "Question",
              options,
              correctAnswer,
              explanation: String(q.explanation || "No explanation provided.").trim()
            };
          });
      } catch (err) {
        console.warn(`Failed to generate questions for module ${mod.title}:`, err);
        return [];
      }
    });

    const results = await Promise.all(modulePromises);
    const finalQuestions = results.flat();

    if (finalQuestions.length < 5) {
      throw new Error("Failed to generate enough questions across modules.");
    }

    // Shuffle questions slightly so they aren't completely strictly grouped by module (optional, but nice)
    finalQuestions.sort(() => Math.random() - 0.5);

    course.finalTest = {
      generatedAt: new Date(),
      questions: finalQuestions
    };
    await course.save();

    res.json({ message: "Test generated successfully", finalTest: course.finalTest });
  } catch (error) {
    console.error("Generate Final Test Error:", error);
    res.status(500).json({ error: "Failed to generate final test" });
  }
}

async function triggerBackgroundGeneration(course, lesson) {
  if (lesson.isEnriched || lesson.generationStatus === 'complete' || lesson.generationStatus === 'content' || lesson.generationStatus === 'quiz') return;
  
  try {
    const moduleDoc = course.modules.find(m => m.lessons.some(l => l._id.toString() === lesson._id.toString()));
    const context = { course, moduleDoc, lesson, depth: "standard", language: course.language || "English" };
    const blocks = await createLessonContent(context);
    
    const [videosResult, questionsResult] = await Promise.allSettled([
       findLessonVideos(context),
       createLessonQuiz(lesson)
    ]);

    if (videosResult.status === "fulfilled" && videosResult.value) {
       blocks.splice(Math.floor(blocks.length / 2), 0, ...videosResult.value);
    }

    if (questionsResult.status === "fulfilled" && questionsResult.value) {
       lesson.testQuestions = questionsResult.value;
    }

    lesson.content = blocks;
    lesson.isEnriched = true;
    lesson.generationStatus = 'complete';
    await lesson.save();
  } catch (err) {
    console.error("Background Generation Error:", err);
  }
}

async function startLessonTest(req, res) {
  try {
    const course = await Course.findById(req.params.courseId).populate({
      path: "modules",
      populate: { path: "lessons" }
    });
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (!ownsCourse(course, req.user._id)) return res.status(403).json({ error: "Forbidden" });

    let currentLesson = null;
    let nextLesson = null;
    let foundCurrent = false;

    for (const mod of course.modules) {
      for (const les of mod.lessons) {
        if (foundCurrent && !nextLesson) nextLesson = les;
        if (les._id.toString() === req.params.lessonId) {
          currentLesson = les;
          foundCurrent = true;
        }
      }
    }

    if (!currentLesson) return res.status(404).json({ error: "Lesson not found" });

    // Note: Background generation was removed so the frontend chunk-based generation
    // can create much deeper, richer content when the user navigates to the next lesson.

    let testQuestions = currentLesson.testQuestions || [];

    // If no questions exist, generate them on the fly (for backwards compatibility with older courses)
    if (testQuestions.length === 0) {
      try {
        const questionsResult = await createLessonQuiz(currentLesson);
        if (questionsResult && questionsResult.length > 0) {
          testQuestions = questionsResult;
          currentLesson.testQuestions = testQuestions;
          await currentLesson.save();
        }
      } catch (err) {
        console.error("Failed to dynamically generate test questions:", err);
      }
    }

    // Get previous result if any
    let previousResult = null;
    if (currentLesson.testAttempts && currentLesson.testAttempts.length > 0) {
      const lastAttempt = currentLesson.testAttempts[currentLesson.testAttempts.length - 1];
      previousResult = {
        score: lastAttempt.score,
        passed: lastAttempt.passed,
        isMaxAttempts: currentLesson.testAttempts.length >= 3,
        answers: lastAttempt.answers ? lastAttempt.answers.map(a => JSON.parse(a)) : [],
        attemptsCount: currentLesson.testAttempts.length,
        nextLessonId: nextLesson ? nextLesson._id : null
      };
    }

    return res.json({ testQuestions, previousResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start test" });
  }
}

async function submitLessonTest(req, res) {
  try {
    const course = await Course.findById(req.params.courseId).populate({
      path: "modules",
      populate: { path: "lessons" }
    });
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (!ownsCourse(course, req.user._id)) return res.status(403).json({ error: "Forbidden" });

    let currentLesson = null;
    let nextLesson = null;
    let foundCurrent = false;

    for (const mod of course.modules) {
      for (const les of mod.lessons) {
        if (foundCurrent && !nextLesson) nextLesson = les;
        if (les._id.toString() === req.params.lessonId) {
          currentLesson = les;
          foundCurrent = true;
        }
      }
    }

    if (!currentLesson) return res.status(404).json({ error: "Lesson not found" });

    const { answers, cheated, navigatedAway } = req.body; // Array of { questionIndex: Number, selectedOption: Number }
    if (!Array.isArray(answers)) return res.status(400).json({ error: "Invalid answers array" });

    if (currentLesson.testAttempts.length >= 3) {
      return res.status(400).json({ error: "Maximum 3 attempts reached." });
    }

    let correctCount = 0;
    const testQuestions = currentLesson.testQuestions || [];
    
    for (const ans of answers) {
       const q = testQuestions[ans.questionIndex];
       if (q && q.correctAnswer === ans.selectedOption) {
           correctCount++;
       }
    }

    const totalQuestions = testQuestions.length || 1;
    let score = Math.round((correctCount / totalQuestions) * 100);
    
    // Penalize if cheated or navigated away
    if (cheated || navigatedAway) {
      score = 0;
      correctCount = 0;
    }

    const passed = score >= 70;

    // Give credits if this is their first attempt AND they passed AND didn't cheat
    const isFirstAttempt = currentLesson.testAttempts.length === 0;
    let creditsEarned = 0;
    let magicScoreEarned = 0;

    if (isFirstAttempt) {
      // Calculate Magic Score
      magicScoreEarned = Math.round(20 * (score / 100) * (passed ? 1.5 : 1.0));
      req.user.globalScore = (req.user.globalScore || 0) + magicScoreEarned;
      req.user.totalTestsTaken = (req.user.totalTestsTaken || 0) + 1;

      // Handle credits if passed
      if (passed && !cheated && !navigatedAway) {
        req.user.credits = (req.user.credits || 0) + 5;
        creditsEarned = 5;
        
        const CreditHistory = require("../models/CreditHistory");
        await CreditHistory.create({
          user: req.user._id,
          amount: 5,
          reason: `Passed Lesson Test on First Attempt: ${currentLesson.title}`
        });
      }

      await req.user.save();
    }

    currentLesson.testAttempts.push({
      score,
      passed,
      date: new Date(),
      answers: answers.map(a => JSON.stringify(a))
    });

    if (passed) {
      currentLesson.isPassed = true;
      currentLesson.completedAt = new Date();
      checkAndSendCourseCompletionEmail(course._id, req.user);
    }
    
    if (nextLesson && !nextLesson.isUnlocked && (passed || currentLesson.testAttempts.length >= 3)) {
        nextLesson.isUnlocked = true;
        await nextLesson.save();
    }

    await currentLesson.save();

    return res.json({ 
       score, 
       passed,
       isMaxAttempts: currentLesson.testAttempts.length >= 3,
       correctCount,
       totalQuestions,
       attemptsCount: currentLesson.testAttempts.length,
       nextLessonUnlocked: !!nextLesson?.isUnlocked,
       nextLessonId: nextLesson ? nextLesson._id : null,
       creditsEarned
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit test" });
  }
}

module.exports = {
  deleteCourse,
  getCourseById,
  getLessonView,
  getMyCourses,
  getPublicCourse,
  updateLessonProgress,
  updateSharing,
  generateFinalTest,
  startLessonTest,
  submitLessonTest,
};
