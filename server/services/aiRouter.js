const gemini = require("./geminiService");
const groq = require("./groqService");
const openai = require("./openaiService");

gemini.name = "gemini";
groq.name = "groq";
openai.name = "openai";

const fallbackChain = [
  // Tier 1: Pro Models
  { provider: gemini, model: "gemini-2.5-pro", key: "GEMINI_API_KEY" },
  { provider: groq, model: "llama-3.3-70b-versatile", key: "GROQ_API_KEY" },
  { provider: openai, model: "gpt-4o", key: "OPENAI_API_KEY" },
  
  // Tier 2: Lite Models
  { provider: gemini, model: "gemini-2.5-flash", key: "GEMINI_API_KEY" },
  { provider: groq, model: "llama-3.1-8b-instant", key: "GROQ_API_KEY" },
  { provider: openai, model: "gpt-4o-mini", key: "OPENAI_API_KEY" },
];

function getProviderChain() {
  const chain = fallbackChain.filter(item => !!process.env[item.key]);
  return chain.length > 0 ? chain : [{ provider: gemini, model: "gemini-1.5-flash" }];
}

async function generateJson(systemPrompt, userPrompt, maxTokens = 4096, validator = null) {
  const chain = getProviderChain();
  let lastError;
  
  for (const { provider, model } of chain) {
    try {
      const result = await provider.generateJson(systemPrompt, userPrompt, maxTokens, model);
      
      // If a validator is provided, it can throw an error to reject the payload and trigger a fallback
      if (validator) {
        await validator(result);
      }
      
      return result;
    } catch (error) {
      console.warn(`[AI Router] ${provider.name} (${model}) failed to generateJson. Switching to next...`);
      lastError = error;
    }
  }
  
  throw lastError;
}

async function* generateJsonStream(systemPrompt, userPrompt, maxTokens = 4096) {
  const chain = getProviderChain();
  let lastError;
  
  for (let i = 0; i < chain.length; i++) {
    const { provider, model } = chain[i];
    let yieldedChunk = false;
    
    try {
      const stream = await provider.generateJsonStream(systemPrompt, userPrompt, maxTokens, model);
      for await (const chunk of stream) {
        yieldedChunk = true;
        yield chunk;
      }
      return; // Stream finished successfully
    } catch (error) {
      if (yieldedChunk) {
        console.error(`[AI Router] ${provider.name} (${model}) stream failed midway. Cannot fallback.`);
        throw error; // Cannot fallback if stream already started sending data to the client
      }
      console.warn(`[AI Router] ${provider.name} (${model}) failed before sending data. Switching to next...`);
      lastError = error;
    }
  }
  
  throw lastError;
}

async function generateText(messages, maxTokens = 1024) {
  const chain = getProviderChain();
  let lastError;
  
  for (const { provider, model } of chain) {
    try {
      return await provider.generateText(messages, maxTokens, model);
    } catch (error) {
      console.warn(`[AI Router] ${provider.name} (${model}) failed to generateText. Switching to next...`);
      lastError = error;
    }
  }
  
  throw lastError;
}

module.exports = { generateJson, generateJsonStream, generateText };
