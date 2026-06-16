const { generateJson, generateJsonStream } = require("./groqService");

const LESSON_DEPTHS = {
  brief: { words: "700-1000", blocks: 5, characters: 2000, maxTokens: 3000 },
  standard: { words: "1100-1600", blocks: 6, characters: 3500, maxTokens: 5000 },
  deep: { words: "1800-2600", blocks: 8, characters: 6000, maxTokens: 7000 },
};

function lessonText(lesson, maxLength = 3000) {
  return (lesson.content || [])
    .filter((block) => block?.type === "heading" || block?.type === "paragraph")
    .map((block) => String(block.text || "").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, maxLength);
}

function formatBlock(block) {
  if (!block || typeof block !== "object") return null;

  switch (block.type) {
    case "heading":
      return {
        type: "heading",
        level: block.level === 3 ? 3 : 2,
        text: String(block.text || "").trim().slice(0, 300),
      };

    case "paragraph":
      return {
        type: "paragraph",
        text: String(block.text || "").trim().slice(0, 5000),
      };

    case "code":
      return {
        type: "code",
        language: String(block.language || "text").trim().slice(0, 40),
        code: String(block.code || "").trim().slice(0, 10000),
      };

    case "list": {
      const items = (Array.isArray(block.items) ? block.items : [])
        .map((item) => String(item || "").trim().slice(0, 1000))
        .filter(Boolean);
      if (!items.length) return null;
      return {
        type: "list",
        style: block.style === "numbered" ? "numbered" : "bullet",
        items,
      };
    }

    case "callout":
      return {
        type: "callout",
        emoji: String(block.emoji || "💡").trim().slice(0, 4),
        title: String(block.title || "").trim().slice(0, 200),
        text: String(block.text || "").trim().slice(0, 2000),
      };

    default:
      return null;
  }
}

function formatBlocks(result) {
  const blocks = result.contentBlocks || result.blocks;
  if (!Array.isArray(blocks)) return [];

  return blocks.map(formatBlock).filter((block) => {
    if (!block) return false;
    if (block.type === "list") return block.items.length > 0;
    return block.text || block.code;
  });
}

function isCompleteLesson(blocks, depth) {
  const characters = blocks.reduce(
    (total, block) => {
      if (block.type === "list") return total + block.items.join("").length;
      return total + String(block.text || block.code || "").length;
    },
    0,
  );

  return blocks.length >= depth.blocks && characters >= depth.characters;
}

const RICH_CONTENT_INSTRUCTIONS = `
Allowed block types: "heading", "paragraph", "code", "list", "callout".
- heading: { "type": "heading", "level": 2 or 3, "text": "..." }
- paragraph: { "type": "paragraph", "text": "..." }
- code: { "type": "code", "language": "python", "code": "..." }
- list: { "type": "list", "style": "bullet" or "numbered", "items": ["item1", "item2"] }
- callout: { "type": "callout", "emoji": "💡", "title": "Key Insight", "text": "..." }
Use a rich mix of these types for an engaging lesson. Include at least one code example with realistic, runnable code. Use callouts for key insights or warnings. Use lists for steps or comparisons.
`.trim();

async function createLessonContent({ lesson, moduleDoc, course, depth, language }) {
  const size = LESSON_DEPTHS[depth] || LESSON_DEPTHS.standard;
  const instructions = `
Write a complete standalone lesson as JSON with a "contentBlocks" array.
${RICH_CONTENT_INSTRUCTIONS}
Write roughly ${size.words} words using substantial paragraphs and useful examples.
Teach the topic fully and end with a practical conclusion.
Write in ${language}. Do not include quizzes, markdown, or videos.
  `.trim();
  const context = `
Lesson: ${lesson.title}
Module: ${moduleDoc.title}
Course: ${course.title}
Course description: ${course.description || "Not provided"}
  `.trim();

  let blocks = formatBlocks(await generateJson(instructions, context, size.maxTokens));

  if (!isCompleteLesson(blocks, size)) {
    blocks = formatBlocks(await generateJson(
      `${instructions}\nThe first draft was too short. Return a complete, detailed lesson.`,
      context,
      size.maxTokens,
    ));
  }

  if (!isCompleteLesson(blocks, size)) {
    const error = new Error("AI returned incomplete lesson content. Please try again.");
    error.statusCode = 502;
    throw error;
  }

  return blocks;
}

/**
 * Incrementally parse a JSON response looking for objects inside the
 * "contentBlocks" array. Calls \`onBlock(block)\` each time a complete
 * block object is extracted from the streaming text.
 *
 * Returns the full array of formatted blocks when the stream finishes.
 */
async function streamLessonContent({ lesson, moduleDoc, course, depth, language, onBlock }) {
  const size = LESSON_DEPTHS[depth] || LESSON_DEPTHS.standard;
  const instructions = `
Write a complete standalone lesson as JSON with a "contentBlocks" array.
${RICH_CONTENT_INSTRUCTIONS}
Write roughly ${size.words} words using substantial paragraphs and useful examples.
Teach the topic fully and end with a practical conclusion.
Write in ${language}. Do not include quizzes, markdown, or videos.
Return ONLY valid JSON. No explanation before or after the JSON.
  `.trim();
  const context = `
Lesson: ${lesson.title}
Module: ${moduleDoc.title}
Course: ${course.title}
Course description: ${course.description || "Not provided"}
  `.trim();

  const chunks = generateJsonStream(instructions, context, size.maxTokens);
  let buffer = "";
  const blocks = [];
  let insideArray = false;
  let braceDepth = 0;
  let blockStart = -1;
  let inString = false;
  let escapeNext = false;

  for await (const chunk of chunks) {
    buffer += chunk;

    // Scan character-by-character to find complete JSON objects inside the array
    for (let i = buffer.length - chunk.length; i < buffer.length; i++) {
      const char = buffer[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === "\\") {
        if (inString) escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (!insideArray && char === "[") {
        insideArray = true;
        continue;
      }
      if (!insideArray) continue;

      if (char === "{") {
        if (braceDepth === 0) blockStart = i;
        braceDepth++;
      } else if (char === "}") {
        braceDepth--;
        if (braceDepth === 0 && blockStart >= 0) {
          const raw = buffer.slice(blockStart, i + 1);
          try {
            const parsed = JSON.parse(raw);
            const formatted = formatBlock(parsed);
            if (formatted && (formatted.text || formatted.code || formatted.items?.length)) {
              blocks.push(formatted);
              if (onBlock) onBlock(formatted);
            }
          } catch {
            // incomplete or malformed block, skip
          }
          blockStart = -1;
        }
      }
    }
  }

  return blocks;
}

async function answerLessonQuestion({ lesson, moduleDoc, course, message, history }) {
  const { generateText } = require("./groqService");
  const recentHistory = (Array.isArray(history) ? history : []).slice(-6).map((item) => ({
    role: item?.role === "user" ? "user" : "assistant",
    content: String(item?.content || "").trim().slice(0, 1000),
  })).filter((item) => item.content);

  return generateText([
    {
      role: "system",
      content: \`
You are a tutor for "\${lesson.title}" in "\${moduleDoc.title}" from "\${course.title}".
Use this lesson when answering:
\${lessonText(lesson, 2000) || "No detailed lesson content is available yet."}
Answer clearly and in the same language as the student.
Lead with a direct answer, then add only the detail needed to teach it well.
Format longer answers with short Markdown paragraphs, bullets, or numbered steps.
Use fenced code blocks for code. Avoid oversized headings and long walls of text.
      \`.trim(),
    },
    ...recentHistory,
    { role: "user", content: message },
  ]);
}

module.exports = { answerLessonQuestion, createLessonContent, streamLessonContent };
