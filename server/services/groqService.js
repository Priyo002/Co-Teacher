const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant"; // use a modern fast model

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function groqError(error) {
  const details = error.error?.error || error.error || {};
  let message = "AI service is unavailable. Please try again.";
  let statusCode = 502;

  if (error.status === 429 || details.code === "rate_limit_exceeded") {
    message = "AI rate limit reached. Please wait a few seconds and try again.";
    statusCode = 429;
  } else if (error.status === 413) {
    message = "The AI request is too large. Try using less context.";
    statusCode = 413;
  }

  const serviceError = new Error(message);
  serviceError.statusCode = statusCode;
  return serviceError;
}

async function generateJson(systemPrompt, userPrompt, maxTokens = 4096) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      const result = parseJson(completion.choices[0]?.message?.content || "");

      if (result) return result;
    } catch (error) {
      const details = error.error?.error || error.error || {};
      const result = details.failed_generation ? parseJson(details.failed_generation) : null;

      if (result) return result;
      if (details.code === "json_validate_failed") continue;
      throw groqError(error);
    }
  }

  const error = new Error("AI returned an invalid response. Please try again.");
  error.statusCode = 502;
  throw error;
}

async function* generateJsonStream(systemPrompt, userPrompt, maxTokens = 4096) {
  try {
    const stream = await groq.chat.completions.create({
      model,
      reasoning_effort: "low",
      temperature: 0.3,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  } catch (error) {
    throw groqError(error);
  }
}

async function generateText(messages, maxTokens = 1024) {
  try {
    const completion = await groq.chat.completions.create({
      model,
      reasoning_effort: "low",
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    throw groqError(error);
  }
}

module.exports = { generateJson, generateJsonStream, generateText };
