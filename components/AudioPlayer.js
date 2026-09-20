'use client';
import { useState, useRef, useEffect } from 'react';
import WaveformVisualizer from './WaveformVisualizer';
import { usePlayer } from '../context/PlayerContext';

export default function AudioPlayer() {
  const { currentSong, isPlaying, setIsPlaying, handleNext, handlePrev } = usePlayer();
  const onTogglePlay = setIsPlaying;
  const onNext = handleNext;
  const onPrev = handlePrev;
  const audioRef = useRef(null);
  const vocalRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [vocalVolume, setVocalVolume] = useState(0.9);
  const [vocalOffset, setVocalOffset] = useState(0.0); // Default 0.0s intro alignment
  const [vocalSpeed, setVocalSpeed] = useState(1.0);   // Tempo rate (0.85x - 1.15x)
  const [isMuted, setIsMuted] = useState(false);
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [showVocalMix, setShowVocalMix] = useState(false);

  // Reload & play when song changes
  useEffect(() => {
    if (!audioRef.current || !currentSong?.audioUrl) return;
    audioRef.current.load();
    if (vocalRef.current && currentSong?.vocalUrl) {
      vocalRef.current.load();
      vocalRef.current.playbackRate = vocalSpeed;
    }
    if (isPlaying) {
      audioRef.current.play().catch((err) => console.log('Playback error:', err));
    }
  }, [currentSong]);

  // Handle play/pause toggle — sync both tracks with offset
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => console.log('Playback error:', err));
      if (vocalRef.current && currentSong?.vocalUrl) {
        const cur = audioRef.current.currentTime;
        const targetVocal = Math.max(0, cur - vocalOffset);
        vocalRef.current.currentTime = targetVocal;
        vocalRef.current.playbackRate = vocalSpeed;
        if (cur >= vocalOffset) {
          vocalRef.current.play().catch(() => {});
        }
      }
    } else {
      audioRef.current.pause();
      if (vocalRef.current) vocalRef.current.pause();
    }
  }, [isPlaying]);

  // Keep vocal volume and speed in sync
  useEffect(() => {
    if (vocalRef.current) {
      vocalRef.current.volume = isMuted ? 0 : vocalVolume;
      vocalRef.current.playbackRate = vocalSpeed;
    }
  }, [vocalVolume, vocalSpeed, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      setCurrentTime(cur);
      setDuration(audioRef.current.duration || 0);

      // Auto-correct time drift between backing track and vocals accounting for beat drop offset
      if (vocalRef.current && currentSong?.vocalUrl) {
        if (cur < vocalOffset) {
          if (!vocalRef.current.paused) vocalRef.current.pause();
        } else {
          if (isPlaying && vocalRef.current.paused) {
            vocalRef.current.play().catch(() => {});
          }
          const targetTime = cur - vocalOffset;
          if (Math.abs(vocalRef.current.currentTime - targetTime) > 0.12) {
            vocalRef.current.currentTime = targetTime;
          }
        }
      }
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) audioRef.current.currentTime = newTime;
    if (vocalRef.current && currentSong?.vocalUrl) {
      const targetVocal = Math.max(0, newTime - vocalOffset);
      vocalRef.current.currentTime = targetVocal;
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentSong) return null;

  return (
    <div className="player-bar glass-panel">
      {/* Music track */}
      <audio
        ref={audioRef}
        src={currentSong?.audioUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => {
          onNext();
        }}
      />
      {/* Vocal track — synced alongside music */}
      {currentSong?.vocalUrl && (
        <audio
          ref={vocalRef}
          src={currentSong.vocalUrl}
        />
      )}

      {/* Song Info */}
      <div className="song-info">
        <div
          className="song-artwork"
          style={{ background: currentSong.coverGradient || 'var(--gradient-primary)' }}
        >
          <span>🎵</span>
        </div>
        <div className="song-details">
          <h4 className="song-title">{currentSong.title}</h4>
          <span className="song-meta">
            {currentSong.genre || 'AI Generated'} • {currentSong.userName || 'You'}
          </span>
        </div>
      </div>

      {/* Controls & Waveform */}
      <div className="player-center">
        <div className="player-controls">
          <button className="control-btn" onClick={onPrev} title="Previous">
            ⏮
          </button>
          <button
            className="play-pause-btn"
            onClick={() => onTogglePlay(!isPlaying)}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="control-btn" onClick={onNext} title="Next">
            ⏭
          </button>
        </div>

        <div className="timeline-container">
          <span className="time-text">{formatTime(currentTime)}</span>
          <div className="waveform-box">
            <WaveformVisualizer isPlaying={isPlaying} barCount={45} height={28} />
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="seek-slider"
            />
          </div>
          <span className="time-text">{formatTime(duration || currentSong.duration)}</span>
        </div>
      </div>

      {/* Actions & Volume */}
      <div className="player-right">
        {currentSong.lyrics && (
          <button
            className={`action-btn ${showLyricsModal ? 'active' : ''}`}
            onClick={() => setShowLyricsModal(!showLyricsModal)}
            title="View Lyrics"
          >
            📜 Lyrics
          </button>
        )}

        {currentSong.hasVocals && currentSong.vocalUrl && (
          <div className="vocal-mix-wrap">
            <button
              className={`action-btn vocal-mix-btn ${showVocalMix ? 'active' : ''}`}
              onClick={() => setShowVocalMix(!showVocalMix)}
              title="Vocal Mix & Sync"
            >
              🎤 Mix & Sync
            </button>
            {showVocalMix && (
              <div className="vocal-mix-panel glass-panel">
                <div className="mix-row">
                  <span className="mix-label">🎤 Vocal Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={vocalVolume}
                    onChange={(e) => setVocalVolume(parseFloat(e.target.value))}
                    className="volume-slider"
                  />
                  <span className="mix-pct">{Math.round(vocalVolume * 100)}%</span>
                </div>
                <div className="mix-row">
                  <span className="mix-label">🥁 Beat Delay</span>
                  <input
                    type="range"
                    min="0"
                    max="4.0"
                    step="0.1"
                    value={vocalOffset}
                    onChange={(e) => setVocalOffset(parseFloat(e.target.value))}
                    className="volume-slider"
                  />
                  <span className="mix-pct">{vocalOffset.toFixed(1)}s</span>
                </div>
                <div className="mix-row">
                  <span className="mix-label">⚡ Tempo Speed</span>
                  <input
                    type="range"
                    min="0.85"
                    max="1.15"
                    step="0.02"
                    value={vocalSpeed}
                    onChange={(e) => setVocalSpeed(parseFloat(e.target.value))}
                    className="volume-slider"
                  />
                  <span className="mix-pct">{vocalSpeed.toFixed(2)}x</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="volume-control">
          <button
            className="volume-btn"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted || volume === 0 ? '🔇' : '🔊'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setIsMuted(false);
              setVolume(parseFloat(e.target.value));
            }}
            className="volume-slider"
          />
        </div>
      </div>

      {/* Lyrics Modal overlay */}
      {showLyricsModal && currentSong.lyrics && (
        <div className="lyrics-popover glass-panel">
          <div className="lyrics-header">
            <h3>{currentSong.lyrics.title || currentSong.title} — Lyrics</h3>
            <button className="close-btn" onClick={() => setShowLyricsModal(false)}>
              ✕
            </button>
          </div>
          <pre className="lyrics-content">{currentSong.lyrics.lyrics || currentSong.lyrics}</pre>
        </div>
      )}

      <style jsx>{`
        .player-bar {
          position: fixed;
          bottom: 0;
          left: var(--sidebar-width);
          right: 0;
          height: var(--player-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          z-index: 90;
          border-top: 1px solid var(--border-color);
        }

        .song-info {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 240px;
        }

        .song-artwork {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
        }

        .song-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .song-title {
          font-family: var(--font-heading);
          font-size: 15px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .song-meta {
          font-size: 12px;
          color: var(--text-muted);
        }

        .player-center {
          flex: 1;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .player-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .control-btn {
          font-size: 18px;
          color: var(--text-secondary);
          transition: transform 0.15s ease, color 0.15s ease;
        }

        .control-btn:hover {
          color: var(--text-primary);
          transform: scale(1.1);
        }

        .play-pause-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--gradient-primary);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 0 16px var(--accent-purple-glow);
          transition: transform 0.2s ease;
        }

        .play-pause-btn:hover {
          transform: scale(1.08);
        }

        .timeline-container {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .time-text {
          font-size: 11px;
          color: var(--text-muted);
          width: 36px;
          font-variant-numeric: tabular-nums;
        }

        .waveform-box {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .seek-slider {
          position: absolute;
          width: 100%;
          top: 0;
          left: 0;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .player-right {
          display: flex;
          align-items: center;
          gap: 18px;
          width: 240px;
          justify-content: flex-end;
        }

        .action-btn {
          font-size: 13px;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }

        .action-btn:hover, .action-btn.active {
          color: var(--text-primary);
          background: rgba(124, 58, 237, 0.2);
          border-color: var(--accent-purple);
        }

        .vocal-mix-wrap {
          position: relative;
        }

        .vocal-mix-panel {
          position: absolute;
          bottom: calc(100% + 12px);
          right: 0;
          padding: 14px 18px;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 12px;
          white-space: nowrap;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7);
          z-index: 200;
          background: rgba(18, 18, 24, 0.95);
          border: 1px solid var(--border-color);
          min-width: 240px;
        }

        .mix-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .mix-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--accent-purple);
          width: 100px;
        }

        .mix-pct {
          font-size: 11px;
          color: var(--text-muted);
          width: 36px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .volume-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .volume-btn {
          font-size: 16px;
        }

        .volume-slider {
          width: 70px;
          accent-color: var(--accent-purple);
        }

        .lyrics-popover {
          position: fixed;
          bottom: calc(var(--player-height) + 16px);
          right: 28px;
          width: 380px;
          max-height: 480px;
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
          z-index: 100;
        }

        .lyrics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-color);
        }

        .lyrics-header h3 {
          font-family: var(--font-heading);
          font-size: 16px;
        }

        .close-btn {
          font-size: 14px;
          color: var(--text-muted);
        }

        .lyrics-content {
          font-family: var(--font-body);
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary);
          white-space: pre-wrap;
          overflow-y: auto;
          max-height: 380px;
        }
      `}</style>
    </div>
  );
}
