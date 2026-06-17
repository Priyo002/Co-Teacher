const gemini = require("./geminiService");
const groq = require("./groqService");
const openai = require("./openaiService");

gemini.name = "gemini";

// Build a priority queue of available providers
function getProviders() {
  const available = [];
  if (process.env.GEMINI_API_KEY) available.push(gemini);
  if (process.env.GROQ_API_KEY) available.push(groq);
  if (process.env.OPENAI_API_KEY) available.push(openai);
  
  // If absolutely none are configured, default to gemini which will naturally throw an error
  return available.length > 0 ? available : [gemini];
}

async function generateJson(systemPrompt, userPrompt, maxTokens = 4096) {
  const providers = getProviders();
  let lastError;
  
  for (const provider of providers) {
    try {
      return await provider.generateJson(systemPrompt, userPrompt, maxTokens);
    } catch (error) {
      console.warn(`[AI Router] ${provider.name} failed to generateJson. Switching to next provider...`);
      lastError = error;
    }
  }
  
  throw lastError;
}

async function* generateJsonStream(systemPrompt, userPrompt, maxTokens = 4096) {
  const providers = getProviders();
  let lastError;
  
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      const stream = await provider.generateJsonStream(systemPrompt, userPrompt, maxTokens);
      for await (const chunk of stream) {
        yield chunk;
      }
      return; // Stream finished successfully
    } catch (error) {
      console.warn(`[AI Router] ${provider.name} failed to generateJsonStream. Switching to next provider...`);
      lastError = error;
    }
  }
  
  throw lastError;
}

async function generateText(messages, maxTokens = 1024) {
  const providers = getProviders();
  let lastError;
  
  for (const provider of providers) {
    try {
      return await provider.generateText(messages, maxTokens);
    } catch (error) {
      console.warn(`[AI Router] ${provider.name} failed to generateText. Switching to next provider...`);
      lastError = error;
    }
  }
  
  throw lastError;
}

module.exports = { generateJson, generateJsonStream, generateText };
