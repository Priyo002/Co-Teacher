const { OpenAI } = require("openai");

const KeyManager = require("./keyManager");
const openaiKeys = new KeyManager("OPENAI_API_KEY");

function parseJson(value) {
  try {
    const cleaned = value.replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function generateJson(systemPrompt, userPrompt, maxTokens = 4096, modelName = "gpt-4o-mini") {
  const apiKey = openaiKeys.getKey();
  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
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
    if (!result) throw new Error("OpenAI returned invalid JSON");
    return result;
  } catch (error) {
    if (error.status === 429 || (error.response && error.response.status === 429)) {
      openaiKeys.markExhausted(apiKey);
    }
    throw error;
  }
}

async function* generateJsonStream(systemPrompt, userPrompt, maxTokens = 4096, modelName = "gpt-4o-mini") {
  const apiKey = openaiKeys.getKey();
  const openai = new OpenAI({ apiKey });

  try {
    const stream = await openai.chat.completions.create({
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
  } catch (error) {
    if (error.status === 429 || (error.response && error.response.status === 429)) {
      openaiKeys.markExhausted(apiKey);
    }
    throw error;
  }
}

async function generateText(messages, maxTokens = 1024, modelName = "gpt-4o-mini") {
  const apiKey = openaiKeys.getKey();
  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    });
    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    if (error.status === 429 || (error.response && error.response.status === 429)) {
      openaiKeys.markExhausted(apiKey);
    }
    throw error;
  }
}

module.exports = { generateJson, generateJsonStream, generateText, name: "openai" };
