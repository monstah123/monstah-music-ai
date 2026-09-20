// Gemini lyrics generator
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generate song lyrics and metadata via Gemini.
 * Falls back through a model priority list to handle quota/availability issues.
 */
export const generateLyrics = async ({ prompt, genre = 'pop' }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env.local');

  const genAI = new GoogleGenerativeAI(apiKey);

  // Priority list of valid Gemini models (fastest first)
  const modelCandidates = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash-exp',
  ];

  const systemPrompt = `You are an elite music songwriter. Generate catchy, punchy, highly rhythmic song lyrics based on the theme and genre provided.

Rules for lyrics:
- Write short, punchy 4-8 word lines that rhyme and flow naturally on a beat.
- Avoid long conversational prose or instructions.
- Structure clearly with [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro].
- Each section should have 4-6 lines.
- Lyrics should feel authentic to the "${genre}" genre.

You MUST respond with ONLY a valid JSON object (no markdown, no explanation), with these fields:
{
  "title": "Creative song title (3-6 words)",
  "lyrics": "Full lyrics with [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro] sections",
  "genre": "${genre}",
  "mood": "One word: energetic|melancholic|uplifting|euphoric|chill|intense|romantic|rebellious",
  "bpm_suggestion": "Suggested BPM range e.g. 120-130"
}

Theme: ${prompt}
Genre: ${genre}`;

  let result = null;
  let lastError = null;

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      result = await model.generateContent(systemPrompt);
      if (result?.response) break;
    } catch (err) {
      lastError = err;
      console.warn(`Gemini model ${modelName} failed:`, err.message);
    }
  }

  if (!result) {
    throw lastError || new Error('Failed to generate lyrics with Gemini API');
  }

  const text = result.response.text().trim();

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  // Extract JSON from response
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // JSON parse failed — return raw text wrapped in object
    }
  }

  // Fallback
  return {
    title: prompt.split(' ').slice(0, 4).join(' '),
    lyrics: text,
    genre,
    mood: 'vibrant',
    bpm_suggestion: '120-130',
  };
};
