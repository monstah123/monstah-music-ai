import { NextResponse } from 'next/server';
import { generateLyrics } from '../../../lib/gemini';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, genre = 'pop' } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_gemini_api_key')) {
      // Mock lyrics fallback if key is placeholder
      const words = prompt.split(' ');
      const title = words.slice(0, 4).join(' ').toUpperCase();
      return NextResponse.json({
        title: title || 'MONSTAH!!! ANTHEM',
        lyrics: `[Verse 1]\nEchoes in the dark, lighting up the sky\nWe are building dreams that will never die\nEvery single heartbeatSyncing with the sound\nFeel the heavy rhythm taking over now\n\n[Chorus]\n${title || 'MONSTAH!!! ANTHEM'} — feel the electric charge\nLiving out loud, living life extra large\nFrom the highest peak to the deepest beat\nMusic generated right here on the street\n\n[Verse 2]\nFrequencies align, neural pathways bright\nCreating original magic through the night\nNo limits now, we set the world ablaze\nLost inside the rhythm of a thousand days\n\n[Outro]\n${title || 'MONSTAH!!! ANTHEM'}... fade out.`,
        genre,
        mood: 'energetic',
        bpm_suggestion: '128',
        isDemoMode: true,
      });
    }

    try {
      const lyricsData = await generateLyrics({ prompt, genre });
      return NextResponse.json(lyricsData);
    } catch (apiErr) {
      console.warn('Gemini API call failed, falling back to mock lyrics:', apiErr.message);
      const words = prompt.split(' ');
      const title = words.slice(0, 4).join(' ').toUpperCase();
      return NextResponse.json({
        title: title || 'MONSTAH!!! ANTHEM',
        lyrics: `[Verse 1]\nEchoes in the dark, lighting up the sky\nWe are building dreams that will never die\nEvery single heartbeatSyncing with the sound\nFeel the heavy rhythm taking over now\n\n[Chorus]\n${title || 'MONSTAH!!! ANTHEM'} — feel the electric charge\nLiving out loud, living life extra large\nFrom the highest peak to the deepest beat\nMusic generated right here on the street\n\n[Verse 2]\nFrequencies align, neural pathways bright\nCreating original magic through the night\nNo limits now, we set the world ablaze\nLost inside the rhythm of a thousand days\n\n[Outro]\n${title || 'MONSTAH!!! ANTHEM'}... fade out.`,
        genre,
        mood: 'energetic',
        bpm_suggestion: '128',
        isDemoMode: true,
      });
    }
  } catch (error) {
    console.error('Lyrics Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate lyrics' },
      { status: 500 }
    );
  }
}
