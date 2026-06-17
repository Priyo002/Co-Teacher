const Groq = require("groq-sdk");

function getApiKey() {
  const keysStr = process.env.GROQ_API_KEY || "";
  const keys = keysStr.split(',').map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) return undefined;
  return keys[Math.floor(Math.random() * keys.length)];
}

function parseJson(value) {
  try {
    const cleaned = value.replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function generateJson(systemPrompt, userPrompt, maxTokens = 4096, modelName = "llama-3.1-8b-instant") {
  const groq = new Groq({ apiKey: getApiKey() });

  const completion = await groq.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: maxTokens,
  });
  
  const result = parseJson(completion.choices[0]?.message?.content || "");
  if (!result) throw new Error("Groq returned invalid JSON");
  return result;
}

async function* generateJsonStream(systemPrompt, userPrompt, maxTokens = 4096, modelName = "llama-3.1-8b-instant") {
  const groq = new Groq({ apiKey: getApiKey() });

  const stream = await groq.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: maxTokens,
    stream: true,
  });
  
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

async function generateText(messages, maxTokens = 1024, modelName = "llama-3.1-8b-instant") {
  const groq = new Groq({ apiKey: getApiKey() });

  const completion = await groq.chat.completions.create({
    model: modelName,
    messages,
    temperature: 0.7,
    max_tokens: maxTokens,
  });
  return completion.choices[0]?.message?.content || "";
}

module.exports = { generateJson, generateJsonStream, generateText, name: "groq" };
