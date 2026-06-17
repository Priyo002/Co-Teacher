const crypto = require("crypto");
const Course = require("../models/Course");
const { deleteCourseRecords } = require("../services/coursePersistence");
const { getOwnedLesson } = require("../services/lessonAccessService");

const COURSE_OUTLINE = {
  path: "modules",
  select: "title lessons",
  populate: {
    path: "lessons",
    select: "title isEnriched completedAt bookmarked lastOpenedAt quizBestScore quizAttempts",
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
    .select("title description modules isPublic shareId creator")
    .populate(COURSE_OUTLINE)
    .lean();

  if (!course) return res.status(404).json({ error: "Course not found" });
  if (!ownsCourse(course, req.user._id)) return res.status(403).json({ error: "Forbidden" });

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
  const { lesson } = await getOwnedLesson(req.params.lessonId, req.user._id);

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

  await lesson.save();
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
        select: "title content language isEnriched",
      },
    })
    .lean();

  if (!course) return res.status(404).json({ error: "Shared course not found" });
  return res.json(course);
}

module.exports = {
  deleteCourse,
  getCourseById,
  getLessonView,
  getMyCourses,
  getPublicCourse,
  updateLessonProgress,
  updateSharing,
};
