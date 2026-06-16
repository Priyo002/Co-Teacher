const { createCourseOutline } = require("../services/courseGeneration");
const { streamLessonContent, createLessonContent } = require("../services/lessonGeneration");
const { saveGeneratedCourse } = require("../services/coursePersistence");
const { getOwnedLesson } = require("../services/lessonAccessService");
const { findLessonVideos } = require("../services/youtubeService");
const { createLessonFlashcards, createPracticeLab, createLessonQuiz } = require("../services/studyGeneration");

const VALID_DEPTHS = new Set(["brief", "standard", "deep"]);

async function generateCourseContent(req, res) {
  const prompt = String(req.body?.prompt || "").trim().slice(0, 2000);

  if (prompt.length < 10) {
    return res.status(400).json({ error: "Describe the course in at least 10 characters" });
  }

  const outline = await createCourseOutline(prompt);
  const course = await saveGeneratedCourse(outline, req.user._id);

  return res.status(201).json(course);
}

async function enrichLesson(req, res) {
  const context = await getOwnedLesson(req.params.lessonId, req.user._id);
  const requestedDepth = String(req.body?.depth || "").trim().slice(0, 20);
  const depth = VALID_DEPTHS.has(requestedDepth) ? requestedDepth : "standard";
  const language = String(req.body?.language || "").trim().slice(0, 80) || "English";

  context.lesson.content = await createLessonContent({ ...context, depth, language });
  context.lesson.language = language;
  context.lesson.isEnriched = true;
  await context.lesson.save();

  return res.json(context.lesson.toObject({ depopulate: true }));
}

async function enrichLessonStream(req, res) {
  const context = await getOwnedLesson(req.params.lessonId, req.user._id);
  const requestedDepth = String(req.body?.depth || "").trim().slice(0, 20);
  const depth = VALID_DEPTHS.has(requestedDepth) ? requestedDepth : "standard";
  const language = String(req.body?.language || "").trim().slice(0, 80) || "English";

  // Set up SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  let closed = false;
  res.on("close", () => { closed = true; });

  function sendEvent(event, data) {
    if (closed) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  try {
    const blocks = await streamLessonContent({
      ...context,
      depth,
      language,
      onBlock(block) {
        sendEvent("block", block);
      },
    });

    // Save to database
    context.lesson.content = blocks;
    context.lesson.language = language;
    context.lesson.isEnriched = true;
    await context.lesson.save();

    sendEvent("done", context.lesson.toObject({ depopulate: true }));
  } catch (error) {
    sendEvent("error", {
      error: error.message || "Failed to generate lesson content.",
    });
  } finally {
    if (!closed) res.end();
  }
}

async function addSuggestedVideos(req, res) {
  const context = await getOwnedLesson(req.params.lessonId, req.user._id);
  const videos = await findLessonVideos(context);

  context.lesson.content = [...(context.lesson.content || []), ...videos];
  await context.lesson.save();

  return res.json({
    lesson: context.lesson.toObject({ depopulate: true }),
    videos,
  });
}

async function generateQuiz(req, res) {
  const { lesson } = await getOwnedLesson(req.params.lessonId, req.user._id);
  const questions = await createLessonQuiz(lesson);

  return res.json({ questions });
}

async function generateFlashcards(req, res) {
  const { lesson } = await getOwnedLesson(req.params.lessonId, req.user._id);
  const flashcards = await createLessonFlashcards(lesson);

  return res.json({ flashcards });
}

async function generatePracticeLab(req, res) {
  const context = await getOwnedLesson(req.params.lessonId, req.user._id);
  const lab = await createPracticeLab(context);

  return res.json({ lab });
}

module.exports = {
  generateCourseContent,
  enrichLesson,
  enrichLessonStream,
  addSuggestedVideos,
  generateQuiz,
  generateFlashcards,
  generatePracticeLab,
};
