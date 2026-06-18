const gemini = require("./geminiService");
const groq = require("./groqService");
const openrouter = require("./openrouterService");
const AiTelemetry = require("../models/AiTelemetry");

function logTelemetry(data) {
  try {
    AiTelemetry.create(data).catch(err => {
      console.warn("[Telemetry] Failed to save log:", err.message);
    });
  } catch (e) {
    // Ignore synchronous errors so it never blocks the main thread
  }
}

gemini.name = "gemini";
groq.name = "groq";
openrouter.name = "openrouter";

const fallbackChain = [
  // Tier 1: Heavyweight / High Intelligence (Highest Success Rates)
  { provider: groq, model: "llama-3.3-70b-versatile", key: "GROQ_API_KEY" },
  { provider: groq, model: "openai/gpt-oss-120b", key: "GROQ_API_KEY" },
  { provider: openrouter, model: "openai/gpt-4o", key: "OPENROUTER_API_KEY" },
  
  // Tier 2: Fast & Capable (Mid-size)
  { provider: openrouter, model: "mistralai/mixtral-8x7b-instruct", key: "OPENROUTER_API_KEY" },
  { provider: gemini, model: "gemini-2.5-flash", key: "GEMINI_API_KEY" },
  { provider: groq, model: "meta-llama/llama-4-scout-17b-16e-instruct", key: "GROQ_API_KEY" },
  { provider: groq, model: "qwen/qwen3.6-27b", key: "GROQ_API_KEY" },
  { provider: groq, model: "groq/compound", key: "GROQ_API_KEY" },
  
  // Tier 3: Ultra-fast / Lite / High Quota
  { provider: openrouter, model: "meta-llama/llama-3-8b-instruct", key: "OPENROUTER_API_KEY" },
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
        
        logTelemetry({ provider: provider.name, model, endpoint: 'generateJson', status: 'success' });
        return result;
      } catch (error) {
        logTelemetry({ provider: provider.name, model, endpoint: 'generateJson', status: 'failure', reason: error.message || String(error) });
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
        logTelemetry({ provider: provider.name, model, endpoint: 'generateJsonStream', status: 'success' });
        return; // Stream finished successfully
      } catch (error) {
        logTelemetry({ provider: provider.name, model, endpoint: 'generateJsonStream', status: 'failure', reason: error.message || String(error) });
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
