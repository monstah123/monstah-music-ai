import { NextResponse } from 'next/server';
import { generateMusic } from '../../../lib/replicate';

async function extractAudioUrl(output) {
  if (!output) return null;
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) return extractAudioUrl(output[0]);
  if (typeof output.url === 'function') {
    const u = output.url();
    return u?.href || String(u);
  }
  if (output.href) return output.href;
  // If ReadableStream, buffer it into a base64 Data URI
  if (output[Symbol.asyncIterator] || typeof output.getReader === 'function' || typeof output.read === 'function') {
    try {
      const chunks = [];
      for await (const chunk of output) {
        chunks.push(Buffer.from(chunk));
      }
      const buf = Buffer.concat(chunks);
      return `data:audio/mp3;base64,${buf.toString('base64')}`;
    } catch (err) {
      console.warn('Stream buffering error:', err.message);
    }
  }
  return String(output);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      prompt,
      duration = 30,
      genre = '',
      styleTags = '',
      includeVocals = false,
      lyricsText = '',
      voicePreset = 'male_singer',
      bpmSuggestion = '',
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Clamp duration: 15–120s (Stable Audio 2.5 supports up to 190s)
    const clampedDuration = Math.min(Math.max(parseInt(duration, 10) || 30, 15), 120);

    // Genre demo audio fallback map
    const genreAudioMap = {
      'Pop':        '/demo-audio/pop.mp3',
      'Hip-Hop':    '/demo-audio/hiphop.mp3',
      'Rap':        '/demo-audio/hiphop.mp3',
      'EDM':        '/demo-audio/edm.mp3',
      'Lo-Fi':      '/demo-audio/lofi.mp3',
      'Jazz':       '/demo-audio/jazz.mp3',
      'Rock':       '/demo-audio/rock.mp3',
      'Synthwave':  '/demo-audio/synthwave.mp3',
      'Indie':      '/demo-audio/indie.mp3',
      'Classical':  '/demo-audio/classical.mp3',
      'Orchestral': '/demo-audio/orchestral.mp3',
      'R&B':        '/demo-audio/rnb.mp3',
      'Metal':      '/demo-audio/metal.mp3',
      'Ambient':    '/demo-audio/ambient.mp3',
      'Reggae':     '/demo-audio/reggae.mp3',
      'Soca':       '/demo-audio/soca.mp3',
      'Bouyon':     '/demo-audio/bouyon.mp3',
    };

    const demoAudioUrl = genreAudioMap[genre] || '/demo-audio/synthwave.mp3';

    // No API token → preview mode
    if (
      !process.env.REPLICATE_API_TOKEN ||
      process.env.REPLICATE_API_TOKEN.includes('your_replicate')
    ) {
      await new Promise((res) => setTimeout(res, 1500));
      return NextResponse.json({
        audioUrl: demoAudioUrl,
        vocalUrl: null,
        hasVocals: false,
        duration: clampedDuration,
        isDemoMode: true,
        message: 'Preview mode — add REPLICATE_API_TOKEN to .env.local for live AI audio',
      });
    }

    try {
      // Primary: MiniMax Music 1.5 (True Singing AI Engine)
      // Generates real singing vocals in English matching Gemini lyrics
      const audioOutput = await generateMusic({
        prompt,
        duration: clampedDuration,
        genre,
        styleTags,
        includeVocals,
        voicePreset,
        lyricsText,
        bpmSuggestion,
      });

      const audioUrl = await extractAudioUrl(audioOutput);

      return NextResponse.json({
        audioUrl: audioUrl || demoAudioUrl,
        vocalUrl: null,
        hasVocals: includeVocals,
        duration: clampedDuration,
        isDemoMode: false,
        model: 'minimax-music-1.5',
      });
    } catch (apiErr) {
      console.warn('Replicate API error:', apiErr.message);
      const isBilling =
        apiErr.message.includes('402') ||
        apiErr.message.includes('Insufficient credit') ||
        apiErr.message.includes('Payment');
      return NextResponse.json({
        audioUrl: demoAudioUrl,
        vocalUrl: null,
        hasVocals: false,
        duration: clampedDuration,
        isDemoMode: true,
        message: isBilling
          ? 'Add Replicate billing credits to enable live AI generation → replicate.com/account/billing'
          : `Generation error: ${apiErr.message}`,
      });
    }
  } catch (error) {
    console.error('Music Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate music' },
      { status: 500 }
    );
  }
}
