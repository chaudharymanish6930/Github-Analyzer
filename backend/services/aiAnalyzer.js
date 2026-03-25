const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeWithAI(message) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const result = await model.generateContent(
    `Classify this commit message as GOOD or BAD: "${message}"`
  );

  return result.response.text();
}

module.exports = { analyzeWithAI };