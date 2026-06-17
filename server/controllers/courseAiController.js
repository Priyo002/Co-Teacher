const { createCourseOutline } = require("../services/courseGeneration");
const { streamLessonContent, createLessonContent, answerLessonQuestion } = require("../services/lessonGeneration");
const { saveGeneratedCourse } = require("../services/coursePersistence");
const { getOwnedLesson } = require("../services/lessonAccessService");
const { findLessonVideos } = require("../services/youtubeService");
const { createLessonFlashcards, createPracticeLab, createLessonQuiz } = require("../services/studyGeneration");

const VALID_DEPTHS = new Set(["brief", "standard", "deep"]);

async function generateCourseContent(req, res) {
  try {
    const prompt = String(req.body?.prompt || "").trim().slice(0, 2000);

    if (prompt.length < 10) {
      return res.status(400).json({ error: "Describe the course in at least 10 characters" });
    }

    const outline = await createCourseOutline(prompt);
    const course = await saveGeneratedCourse(outline, req.user._id);

    return res.status(201).json(course);
  } catch (error) {
    console.error("Generate Course Error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to generate course" });
  }
}

async function enrichLesson(req, res) {
  try {
    const context = await getOwnedLesson(req.params.lessonId, req.user._id);
    const requestedDepth = String(req.body?.depth || "").trim().slice(0, 20);
    const depth = VALID_DEPTHS.has(requestedDepth) ? requestedDepth : "standard";
    const language = String(req.body?.language || "").trim().slice(0, 80) || "English";

    const blocks = await createLessonContent({ ...context, depth, language });
    
    context.lesson.content = blocks;

    // Fetch videos and quiz in parallel
    const [videosResult, questionsResult] = await Promise.allSettled([
      findLessonVideos(context),
      createLessonQuiz(context.lesson)
    ]);

    if (videosResult.status === "fulfilled" && videosResult.value) {
      blocks.splice(Math.floor(blocks.length / 2), 0, ...videosResult.value);
    }

    if (questionsResult.status === "fulfilled" && questionsResult.value) {
      blocks.push({
        type: 'quiz',
        title: 'Knowledge Check',
        questions: questionsResult.value
      });
    }

    context.lesson.content = blocks;
    context.lesson.language = language;
    context.lesson.isEnriched = true;
    await context.lesson.save();

    return res.json(context.lesson.toObject({ depopulate: true }));
  } catch (error) {
    console.error("Enrich Lesson Error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to enrich lesson" });
  }
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

    // Temporarily save text blocks to allow quiz generation to use them
    context.lesson.content = blocks;

    const [videosResult, questionsResult] = await Promise.allSettled([
      findLessonVideos(context),
      createLessonQuiz(context.lesson)
    ]);

    if (videosResult.status === "fulfilled" && videosResult.value) {
      for (const v of videosResult.value) {
        blocks.push(v);
        sendEvent("block", v);
      }
    }

    if (questionsResult.status === "fulfilled" && questionsResult.value) {
      const quizBlock = {
        type: 'quiz',
        title: 'Knowledge Check',
        questions: questionsResult.value
      };
      blocks.push(quizBlock);
      sendEvent("block", quizBlock);
    }

    // Save final enriched content to database
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

async function generateFlashcards(req, res) {
  try {
    const { lesson } = await getOwnedLesson(req.params.lessonId, req.user._id);
    const flashcards = await createLessonFlashcards(lesson);

    return res.json({ flashcards });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to generate flashcards" });
  }
}

async function generatePracticeLab(req, res) {
  try {
    const context = await getOwnedLesson(req.params.lessonId, req.user._id);
    const lab = await createPracticeLab(context);

    return res.json({ lab });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to generate lab" });
  }
}

async function chatAboutLesson(req, res) {
  try {
    const message = String(req.body?.message || "").trim().slice(0, 2000);
    if (!message) return res.status(400).json({ error: "Message is required." });

    const context = await getOwnedLesson(req.params.lessonId, req.user._id);
    const reply = await answerLessonQuestion({
      ...context,
      message,
      history: Array.isArray(req.body?.history) ? req.body.history : [],
    });

    return res.json({ reply });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || "Failed to chat" });
  }
}

module.exports = {
  generateCourseContent,
  enrichLesson,
  enrichLessonStream,
  generateFlashcards,
  generatePracticeLab,
  chatAboutLesson,
};
