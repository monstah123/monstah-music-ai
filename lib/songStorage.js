const STORAGE_KEY = 'monstah_songs';

const genreAudioMap = {
  'Pop':        { audio: '/demo-audio/pop.mp3',        vocal: null },
  'Hip-Hop':    { audio: '/demo-audio/hiphop.mp3',     vocal: null },
  'Rap':        { audio: '/demo-audio/hiphop.mp3',     vocal: null },
  'EDM':        { audio: '/demo-audio/edm.mp3',        vocal: null },
  'Lo-Fi':      { audio: '/demo-audio/lofi.mp3',       vocal: null },
  'Jazz':       { audio: '/demo-audio/jazz.mp3',       vocal: null },
  'Rock':       { audio: '/demo-audio/rock.mp3',       vocal: null },
  'Synthwave':  { audio: '/demo-audio/synthwave.mp3',  vocal: null },
  'Indie':      { audio: '/demo-audio/indie.mp3',      vocal: null },
  'Classical':  { audio: '/demo-audio/classical.mp3',  vocal: null },
  'Orchestral': { audio: '/demo-audio/orchestral.mp3', vocal: null },
  'R&B':        { audio: '/demo-audio/rnb.mp3',        vocal: null },
  'Metal':      { audio: '/demo-audio/metal.mp3',      vocal: null },
  'Ambient':    { audio: '/demo-audio/ambient.mp3',    vocal: null },
  'Reggae':     { audio: '/demo-audio/reggae.mp3',     vocal: null },
  'Soca':       { audio: '/demo-audio/soca.mp3',       vocal: null },
  'Bouyon':     { audio: '/demo-audio/bouyon.mp3',     vocal: null },
};

/**
 * Returns true if a URL is a temporary external CDN URL that will expire.
 * Replicate (and similar AI audio services) issue signed URLs that typically
 * expire within 24 hours — so stored songs break after a day.
 */
function isExpiredOrExternalUrl(url) {
  if (!url) return true;
  // Local/static paths are always valid
  if (url.startsWith('/') || url.startsWith('data:')) return false;
  // These are known temporary CDN patterns
  const temporaryHosts = [
    'replicate.delivery',
    'pbxt.replicate.delivery',
    'tjzk.replicate.delivery',
    'storage.googleapis.com',
    'soundhelix.com',
  ];
  try {
    const hostname = new URL(url).hostname;
    return temporaryHosts.some((h) => hostname.includes(h));
  } catch {
    return false;
  }
}

export const saveSong = (song) => {
  if (typeof window === 'undefined') return;
  const songs = getSongs();
  const newSong = {
    ...song,
    id: song.id || `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: song.createdAt || new Date().toISOString(),
  };
  songs.unshift(newSong);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs.slice(0, 100))); // Keep max 100
  return newSong;
};

export const getSongs = () => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];

    // Ensure every stored song has a working, playable audio URL.
    // Replicate / ElevenLabs CDN URLs expire within ~24 hours, so after a day
    // old generated songs silently break. We detect those and replace them with
    // a matching local demo track so songs stay playable indefinitely.
    return parsed.map((song) => {
      const mapping = genreAudioMap[song.genre] || genreAudioMap['Synthwave'];
      const needsFallback =
        !song.audioUrl ||
        song.audioUrl.includes('soundhelix') ||
        song.isDemoMode ||
        isExpiredOrExternalUrl(song.audioUrl);

      if (needsFallback) {
        return {
          ...song,
          audioUrl: mapping.audio,
          vocalUrl: song.hasVocals ? mapping.vocal : null,
        };
      }
      return song;
    });
  } catch {
    return [];
  }
};

export const clearAllUserSongs = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};

export const getSongById = (id) => {
  const songs = getSongs();
  return songs.find((s) => s.id === id) || null;
};

export const deleteSong = (id) => {
  if (typeof window === 'undefined') return;
  const songs = getSongs().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
};

export const updateSong = (id, updates) => {
  if (typeof window === 'undefined') return;
  const songs = getSongs().map((s) => (s.id === id ? { ...s, ...updates } : s));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
};
