// app/lib/ai.js
// Uses Google Gemini free API — set GEMINI_API_KEY in app/lib/config.js
import { CONFIG } from './config';

const GEMINI_MODEL = 'gemini-1.5-flash';

export async function generateText(systemPrompt, userPrompt, opts = {}) {
  const { maxTokens = 1200, temperature = 0.7, json = false } = opts;
  const key = CONFIG.GEMINI_API_KEY;

  if (!key || key === 'PASTE_GEMINI_KEY_HERE') {
    throw new Error('Gemini API key not set. Open app/lib/config.js and paste your free key from https://aistudio.google.com/app/apikey');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}${json ? '\n\nRespond ONLY with valid JSON. No markdown fences, no backticks, no extra text—just the raw JSON object.' : ''}`;

  const body = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: {
      maxOutputTokens: Math.min(maxTokens, 1500),
      temperature,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (json) {
    return text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  }
  return text;
}
