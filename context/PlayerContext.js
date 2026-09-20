'use client';
import { createContext, useContext, useState } from 'react';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);

  const handlePlaySong = (song, songList = []) => {
    if (!song) return;
    if (currentSong?.id === song.id) {
      setIsPlaying((prev) => !prev);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
      if (songList && songList.length > 0) {
        setPlaylist(songList);
      }
    }
  };

  const handleNext = () => {
    if (!playlist.length || !currentSong) return;
    const currentIndex = playlist.findIndex((s) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentSong(playlist[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (!playlist.length || !currentSong) return;
    const currentIndex = playlist.findIndex((s) => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentSong(playlist[prevIndex]);
    setIsPlaying(true);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        onPlaySong: handlePlaySong,
        setIsPlaying,
        handleNext,
        handlePrev,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    return {
      currentSong: null,
      isPlaying: false,
      onPlaySong: () => {},
      setIsPlaying: () => {},
      handleNext: () => {},
      handlePrev: () => {},
    };
  }
  return context;
}
