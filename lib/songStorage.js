const STORAGE_KEY = 'monstah_songs';

const genreAudioMap = {
  'Pop': { audio: '/demo-audio/pop.mp3', vocal: null },
  'Hip-Hop': { audio: '/demo-audio/hiphop.mp3', vocal: null },
  'Rap': { audio: '/demo-audio/hiphop.mp3', vocal: null },
  'EDM': { audio: '/demo-audio/edm.mp3', vocal: null },
  'Lo-Fi': { audio: '/demo-audio/lofi.mp3', vocal: null },
  'Jazz': { audio: '/demo-audio/jazz.mp3', vocal: null },
  'Rock': { audio: '/demo-audio/rock.mp3', vocal: null },
  'Synthwave': { audio: '/demo-audio/synthwave.mp3', vocal: null },
  'Indie': { audio: '/demo-audio/indie.mp3', vocal: null },
  'Classical': { audio: '/demo-audio/classical.mp3', vocal: null },
  'Orchestral': { audio: '/demo-audio/orchestral.mp3', vocal: null },
  'R&B': { audio: '/demo-audio/rnb.mp3', vocal: null },
  'Metal': { audio: '/demo-audio/metal.mp3', vocal: null },
  'Ambient': { audio: '/demo-audio/lofi.mp3', vocal: null },
};

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
    
    // Update stored songs to reflect their genre-specific audio & vocal tracks
    return parsed.map((song) => {
      const mapping = genreAudioMap[song.genre] || genreAudioMap['Synthwave'];
      // Only fix if URL was set to generic preview or missing
      if (!song.audioUrl || song.audioUrl.includes('soundhelix') || song.isDemoMode) {
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
