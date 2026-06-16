const { Router } = require("express");
const { generateCourseContent, enrichLessonStream } = require("../../controllers/courseAiController");
const {
  deleteCourse,
  getCourseById,
  getLessonView,
  getMyCourses,
  updateSharing,
  updateLessonProgress
} = require("../../controllers/courseController");
const { protect } = require("../../middlewares/sessionAuth"); // Using sessionAuth for now

const router = Router();

router.use(protect); // Ensure user is authenticated

router.post("/generate", generateCourseContent);
router.get("/mine", getMyCourses);

router.get("/:courseId/lessons/:lessonId", getLessonView);
router.post("/:courseId/lessons/:lessonId/enrich-stream", enrichLessonStream);
router.patch("/lessons/:lessonId/progress", updateLessonProgress);
router.patch("/:courseId/sharing", updateSharing);

router.route("/:courseId")
  .get(getCourseById)
  .delete(deleteCourse);

module.exports = router;
