// app/lib/ai.js
// Gemini Free Tier — reads key from config.js
import { CONFIG } from './config';

let _gemini = null;

async function getGemini() {
  if (!_gemini) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    _gemini = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
  }
  return _gemini;
}

export function hasGeminiKey() {
  return CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY !== 'PASTE_GEMINI_KEY_HERE';
}

export async function generateText(systemPrompt, userPrompt, opts = {}) {
  const { maxTokens = 1200, temperature = 0.7, json = false } = opts;

  if (!hasGeminiKey()) {
    throw new Error('NO_KEY');
  }

  const genAI = await getGemini();
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  });

  const prompt = `${systemPrompt}\n\n${userPrompt}`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}
