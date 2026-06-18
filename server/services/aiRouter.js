const gemini = require("./geminiService");
const groq = require("./groqService");

gemini.name = "gemini";
groq.name = "groq";

const fallbackChain = [
  // Tier 1: Heavyweight / High Intelligence
  { provider: gemini, model: "gemini-3.1-pro", key: "GEMINI_API_KEY" },
  { provider: gemini, model: "gemini-2.5-pro", key: "GEMINI_API_KEY" },
  { provider: groq, model: "openai/gpt-oss-120b", key: "GROQ_API_KEY" },
  { provider: groq, model: "llama-3.3-70b-versatile", key: "GROQ_API_KEY" },
  
  // Tier 2: Fast & Capable (Flash / Mid-size)
  { provider: gemini, model: "gemini-3.5-flash", key: "GEMINI_API_KEY" },
  { provider: gemini, model: "gemini-3-flash", key: "GEMINI_API_KEY" },
  { provider: groq, model: "meta-llama/llama-4-scout-17b-16e-instruct", key: "GROQ_API_KEY" },
  { provider: groq, model: "qwen/qwen3.6-27b", key: "GROQ_API_KEY" },
  { provider: groq, model: "groq/compound", key: "GROQ_API_KEY" },
  
  // Tier 3: Ultra-fast / Lite / High Quota
  { provider: gemini, model: "gemini-3.1-flash-lite", key: "GEMINI_API_KEY" },
  { provider: groq, model: "llama-3.1-8b-instant", key: "GROQ_API_KEY" },
  { provider: groq, model: "groq/compound-mini", key: "GROQ_API_KEY" },
];

function getProviderChain() {
  const chain = fallbackChain.filter(item => !!process.env[item.key]);
  return chain.length > 0 ? chain : [{ provider: gemini, model: "gemini-1.5-flash" }];
}

async function generateJson(systemPrompt, userPrompt, maxTokens = 4096, validator = null) {
  const chain = getProviderChain();
  let lastError;
  const timeoutMs = 120000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    for (const { provider, model } of chain) {
      if (Date.now() - startTime >= timeoutMs) break;
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
    
    // Add a small delay before retrying the entire chain to prevent tight loops
    if (Date.now() - startTime < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw lastError || new Error("Our AI servers are currently experiencing high traffic. Please try again in a few moments.");
}

async function* generateJsonStream(systemPrompt, userPrompt, maxTokens = 4096) {
  const chain = getProviderChain();
  let lastError;
  const timeoutMs = 120000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    for (let i = 0; i < chain.length; i++) {
      if (Date.now() - startTime >= timeoutMs) break;
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
          throw new Error("Our AI servers are currently experiencing high traffic. Please try again in a few moments.");
        }
        console.warn(`[AI Router] ${provider.name} (${model}) failed before sending data. Switching to next...`);
        lastError = error;
      }
    }
  }
  
  throw lastError || new Error("Our AI servers are currently experiencing high traffic. Please try again in a few moments.");
}

async function generateText(messages, maxTokens = 1024) {
  const chain = getProviderChain();
  let lastError;
  const timeoutMs = 30000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    for (const { provider, model } of chain) {
      if (Date.now() - startTime >= timeoutMs) break;
      try {
        return await provider.generateText(messages, maxTokens, model);
      } catch (error) {
        console.warn(`[AI Router] ${provider.name} (${model}) failed to generateText. Switching to next...`);
        lastError = error;
      }
    }
  }
  
  throw lastError || new Error("Our AI servers are currently experiencing high traffic. Please try again in a few moments.");
}

module.exports = { generateJson, generateJsonStream, generateText };
