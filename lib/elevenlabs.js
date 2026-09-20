// ElevenLabs API integration for hyper-realistic AI voices
// Note: fetch is natively available in Next.js 14 server routes — no import needed

// ElevenLabs Voice IDs mapped to presets
export const ELEVENLABS_VOICES = {
  'female_singer': { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
  'male_singer':   { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  'melodic':       { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  'expressive':    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
};

/**
 * Format raw lyrics text for rhythmic rap/singing delivery.
 * ElevenLabs reads text naturally, so we structure it with pauses,
 * line breaks, and punctuation to create beat-matching cadence.
 */
const formatLyricsForRhythm = (rawText, genre = '') => {
  if (!rawText) return '';

  const isRap = /rap|hip.hop|trap|drill/i.test(genre);

  // 1. Strip structural tags like [Verse], [Chorus], [Bridge] etc.
  let text = rawText.replace(/\[.*?\]/g, '').trim();

  // 2. Split into lines and clean each one
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // 3. Process each line for rhythmic delivery
  const processedLines = lines.map((line) => {
    // Remove lingering punctuation artifacts
    line = line.replace(/^\W+/, '').trim();

    if (isRap) {
      // Rap: add comma pauses mid-line at natural break points
      // This makes ElevenLabs pause slightly — mimicking beat pocket hits
      line = line
        // Add pause after every 3-4 syllable cluster if no punct
        .replace(/(\w{3,}\s\w{3,})\s(\w)/g, '$1, $2')
        // Ensure line ends with punctuation for rhythmic stop
        .replace(/([^.!?,])$/, '$1.');
    } else {
      // Singing: end each line with comma (brief breath) or period (full stop)
      line = line.replace(/([^.!?,])$/, '$1,');
    }

    return line;
  });

  // 4. Group lines into 2-line couplets with a blank line between couplets
  //    This produces natural phrasing pauses between bars
  const couplets = [];
  for (let i = 0; i < processedLines.length; i += 2) {
    const pair = processedLines.slice(i, i + 2).join('\n');
    couplets.push(pair);
  }

  return couplets.join('\n\n');
};

/**
 * Voice settings tuned per genre for the most rhythmic delivery
 */
const getVoiceSettings = (genre = '') => {
  const isRap = /rap|hip.hop|trap|drill/i.test(genre);
  const isSinging = /pop|r&b|rnb|soul|indie|melodic/i.test(genre);

  if (isRap) {
    return {
      stability: 0.25,        // Low = more dynamic, punchy delivery
      similarity_boost: 0.75,
      style: 0.8,             // High style = more expressive/emotive
      use_speaker_boost: true,
    };
  }

  if (isSinging) {
    return {
      stability: 0.40,
      similarity_boost: 0.85,
      style: 0.6,
      use_speaker_boost: true,
    };
  }

  // Default balanced
  return {
    stability: 0.35,
    similarity_boost: 0.80,
    style: 0.65,
    use_speaker_boost: true,
  };
};

/**
 * Generate studio-quality vocals via ElevenLabs API.
 * Formats lyrics for rhythmic rap/singing delivery before synthesis.
 */
export const generateElevenLabsVocals = async ({
  text,
  voicePreset = 'male_singer',
  genre = '',
}) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set in .env.local');
  }

  // Map preset or default to Adam (Male)
  const voiceInfo = ELEVENLABS_VOICES[voicePreset] || ELEVENLABS_VOICES['male_singer'];
  const voiceId = voiceInfo.id;

  // Format lyrics for rhythmic delivery
  const formattedText = formatLyricsForRhythm(text, genre);

  // Limit to ~500 chars to keep within 15-30s range and avoid slow requests
  const finalText = formattedText.slice(0, 500) || text.slice(0, 500);

  const voiceSettings = getVoiceSettings(genre);

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: finalText,
      model_id: 'eleven_multilingual_v2',
      voice_settings: voiceSettings,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }

  // Return as base64 Data URI (works natively as HTML audio src)
  const buffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(buffer).toString('base64');
  return `data:audio/mpeg;base64,${base64Audio}`;
};
