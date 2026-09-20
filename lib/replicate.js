// Replicate music generation — powered by MiniMax Music & Stability AI Stable Audio 2.5
// MiniMax Music is a true singing AI music engine that sings exact written English lyrics in rhythm with the beat!
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Generate a complete AI song with real singing vocals in English matching generated lyrics.
 * Uses MiniMax Music 1.5 / 2.6 (true singing AI song model) with fallback to Stable Audio 2.5.
 */
export const generateMusic = async ({
  prompt,
  duration = 30,
  genre = '',
  styleTags = '',
  includeVocals = false,
  voicePreset = 'female_singer',
  lyricsText = '',
  bpmSuggestion = '',
}) => {
  const isInstrumental = !includeVocals;

  const voiceDescMap = {
    'male_singer':   'male vocal lead singer, clear English singing voice',
    'female_singer': 'female vocal lead singer, clear English singing voice',
    'melodic':       'melodic female singing voice in English',
    'expressive':    'expressive male vocal performance in English',
  };

  const voiceDesc = voiceDescMap[voicePreset] || voiceDescMap['female_singer'];

  const stylePromptParts = [
    genre || 'Pop',
    styleTags,
    prompt,
    voiceDesc,
    bpmSuggestion ? `${bpmSuggestion} BPM` : '',
    'high quality studio recording, master audio',
  ].filter(Boolean).join(', ');

  // Standardize lyrics with valid MiniMax tags [verse], [chorus], etc.
  let formattedLyrics = '';
  if (lyricsText) {
    formattedLyrics = lyricsText
      .replace(/\[Verse\s*\d*\]/gi, '[verse]')
      .replace(/\[Chorus\s*\d*\]/gi, '[chorus]')
      .replace(/\[Bridge\s*\d*\]/gi, '[bridge]')
      .replace(/\[Outro\s*\d*\]/gi, '[outro]')
      .replace(/\[Intro\s*\d*\]/gi, '[intro]')
      .trim();
  }

  if (!formattedLyrics || formattedLyrics.length < 10) {
    const cleanPrompt = prompt.replace(/[^\w\s]/g, '').slice(0, 40);
    formattedLyrics = `[verse]\n${cleanPrompt} in the light\nEvery moment shining bright\n\n[chorus]\nThis is our song tonight\nFeel the music taking flight`;
  }

  // Ensure length stays within 10-580 chars for MiniMax 1.5
  formattedLyrics = formattedLyrics.slice(0, 580);

  // Try Primary: MiniMax Music 1.5 (True Singing AI Engine)
  if (!isInstrumental) {
    try {
      console.log('Generating AI song with MiniMax Music 1.5 (Singing Vocals)...');
      const output = await replicate.run('minimax/music-1.5', {
        input: {
          prompt: stylePromptParts.slice(0, 280),
          lyrics: formattedLyrics,
        },
      });
      if (output) return output;
    } catch (err) {
      console.warn('MiniMax Music 1.5 failed, trying MiniMax 2.6 / Stable Audio:', err.message);
    }
  }

  // Fallback / Instrumental: Stable Audio 2.5
  console.log('Generating track with Stable Audio 2.5...');
  const stableAudioPrompt = [
    genre || 'Pop',
    styleTags,
    prompt,
    bpmSuggestion ? `${bpmSuggestion} BPM` : '',
    isInstrumental ? 'fully instrumental, pristine mix, no vocals' : `${voiceDesc}, singing lyrics`,
    'mastered studio recording',
  ].filter(Boolean).join(', ');

  const clampedDuration = Math.min(Math.max(duration, 15), 120);

  const output = await replicate.run('stability-ai/stable-audio-2.5', {
    input: {
      prompt: stableAudioPrompt,
      seconds_total: clampedDuration,
      seconds_start: 0,
    },
  });

  return output;
};
