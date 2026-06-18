const { Router } = require("express");
const { generateCourseContent, enrichLessonStream, enrichLesson, generateFlashcards, generatePracticeLab, chatAboutLesson, chatAboutCourse, generateLessonOutline, generateLessonChunk, generateLessonQuizChunk } = require("../../controllers/courseAiController");
const {
  deleteCourse,
  getCourseById,
  getLessonView,
  getMyCourses,
  updateSharing,
  updateLessonProgress,
  generateFinalTest
} = require("../../controllers/courseController");
const { verifyAuth0Token } = require("../../middlewares/auth0Auth");

const router = Router();

router.use(verifyAuth0Token); // Ensure user is authenticated via Auth0

router.post("/generate", generateCourseContent);
router.get("/mine", getMyCourses);
router.post("/:courseId/chat", chatAboutCourse);

router.get("/:courseId/lessons/:lessonId", getLessonView);
router.post("/:courseId/lessons/:lessonId/generate/outline", generateLessonOutline);
router.post("/:courseId/lessons/:lessonId/generate/chunk", generateLessonChunk);
router.post("/:courseId/lessons/:lessonId/generate/quiz", generateLessonQuizChunk);

router.post("/:courseId/lessons/:lessonId/enrich", enrichLesson);
router.post("/:courseId/generate-test", generateFinalTest);
router.post("/:courseId/lessons/:lessonId/enrich-stream", enrichLessonStream);
router.post("/:courseId/lessons/:lessonId/flashcards", generateFlashcards);
router.post("/:courseId/lessons/:lessonId/lab", generatePracticeLab);
router.post("/:courseId/lessons/:lessonId/chat", chatAboutLesson);
router.put("/:courseId/lessons/:lessonId/progress", updateLessonProgress);
router.patch("/:courseId/sharing", updateSharing);

router.route("/:courseId")
  .get(getCourseById)
  .delete(deleteCourse);

module.exports = router;
