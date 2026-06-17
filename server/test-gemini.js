require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello",
      config: {
        maxOutputTokens: 8192,
      }
    });
    console.log("Success:", response.text);
  } catch (err) {
    console.error("Error:", err.message || err);
  }
}
test();
