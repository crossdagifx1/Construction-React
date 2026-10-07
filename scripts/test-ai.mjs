import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("=== Testing Google Gemini ===");
console.log("GEMINI_API_KEY present:", Boolean(process.env.GEMINI_API_KEY));

async function runTest() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const prompt = "You are HAVI, an interior design assistant in Addis Ababa. Introduce yourself in 2 sentences.";
    const result = await model.generateContent(prompt);
    console.log("\n[Gemini 3.6 Flash Response]:\n" + result.response.text());
  } catch (err) {
    console.error("\n[Gemini Error]:", err.message);
  }

  console.log("\n=== Testing OpenRouter ===");
  console.log("OPENROUTER_API_KEY present:", Boolean(process.env.OPENROUTER_API_KEY));
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://havisdesign.com",
        "X-Title": "HAVI DESIGN",
      },
      body: JSON.stringify({
        model: "nex-agi/nex-n2.5-mini:free",
        messages: [{ role: "user", content: "Introduce HAVI interior design in 2 sentences." }],
      }),
    });
    const data = await res.json();
    if (res.ok && data.choices?.[0]?.message?.content) {
      console.log("\n[OpenRouter Response]:\n" + data.choices[0].message.content);
    } else {
      console.log("\n[OpenRouter Status]:", res.status, JSON.stringify(data.error || data));
    }
  } catch (err) {
    console.error("\n[OpenRouter Error]:", err.message);
  }
}

runTest();
