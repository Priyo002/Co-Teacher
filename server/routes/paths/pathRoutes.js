const express = require("express");
const router = express.Router();
const {
  generateLearningPath,
  getLearningPaths,
  getLearningPathById,
  deleteLearningPath,
  generatePathCourse
} = require("../../controllers/learningPathController");
const { verifyAuth0Token } = require("../../middlewares/auth0Auth");

router.use(verifyAuth0Token);

router.post("/generate", generateLearningPath);
router.get("/", getLearningPaths);
router.get("/:id", getLearningPathById);
router.delete("/:id", deleteLearningPath);
router.post("/:id/courses/:courseIndex/generate", generatePathCourse);

module.exports = router;
