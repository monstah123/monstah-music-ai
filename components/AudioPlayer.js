'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import WaveformVisualizer from './WaveformVisualizer';
import { usePlayer } from '../context/PlayerContext';
import { triggerDownload } from '../lib/download';

// ─── Mobile Audio Unlock ───────────────────────────────────────────────────
// iOS / Android block audio until a real user gesture fires.
// We silently play + immediately pause a zero-length audio to "unlock" the
// browser's audio context on the very first tap anywhere on the page.
let _audioUnlocked = false;

function unlockAudio(audioEl) {
  if (_audioUnlocked || !audioEl) return;
  _audioUnlocked = true;
  // Play and immediately pause to satisfy the gesture requirement
  audioEl.muted = true;
  const p = audioEl.play();
  if (p && p.then) {
    p.then(() => {
      audioEl.pause();
      audioEl.muted = false;
      audioEl.currentTime = 0;
    }).catch(() => {
      audioEl.muted = false;
    });
  } else {
    audioEl.pause();
    audioEl.muted = false;
    audioEl.currentTime = 0;
  }
}

// Safe wrapper around audio.play() that handles the NotAllowedError on mobile
function safePlay(audioEl) {
  if (!audioEl) return;
  const p = audioEl.play();
  if (p && p.then) {
    p.catch((err) => {
      // NotAllowedError = user hasn't interacted yet; suppress silently
      if (err.name !== 'NotAllowedError') {
        console.warn('Playback error:', err);
      }
    });
  }
}

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
  const [vocalOffset, setVocalOffset] = useState(0.0);
  const [vocalSpeed, setVocalSpeed] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [showVocalMix, setShowVocalMix] = useState(false);

  // ── Register global unlock listener once ──────────────────────────────────
  useEffect(() => {
    const handler = () => {
      if (!_audioUnlocked && audioRef.current) {
        unlockAudio(audioRef.current);
      }
    };
    // touchstart is the earliest possible user gesture on mobile
    document.addEventListener('touchstart', handler, { once: true, passive: true });
    document.addEventListener('click', handler, { once: true });
    return () => {
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('click', handler);
    };
  }, []);

  // ── Reload & play when song changes ──────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current || !currentSong?.audioUrl) return;
    audioRef.current.load();
    if (vocalRef.current && currentSong?.vocalUrl) {
      vocalRef.current.load();
      vocalRef.current.playbackRate = vocalSpeed;
    }
    if (isPlaying) {
      // Small delay ensures load() has registered the new src before play()
      const t = setTimeout(() => {
        safePlay(audioRef.current);
      }, 80);
      return () => clearTimeout(t);
    }
  }, [currentSong]);

  // ── Handle play/pause toggle — sync both tracks with offset ──────────────
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      safePlay(audioRef.current);
      if (vocalRef.current && currentSong?.vocalUrl) {
        const cur = audioRef.current.currentTime;
        const targetVocal = Math.max(0, cur - vocalOffset);
        vocalRef.current.currentTime = targetVocal;
        vocalRef.current.playbackRate = vocalSpeed;
        if (cur >= vocalOffset) {
          safePlay(vocalRef.current);
        }
      }
    } else {
      audioRef.current.pause();
      if (vocalRef.current) vocalRef.current.pause();
    }
  }, [isPlaying]);

  // ── Keep vocal volume and speed in sync ──────────────────────────────────
  useEffect(() => {
    if (vocalRef.current) {
      vocalRef.current.volume = isMuted ? 0 : vocalVolume;
      vocalRef.current.playbackRate = vocalSpeed;
    }
  }, [vocalVolume, vocalSpeed, isMuted]);

  // ── Keep music volume in sync ─────────────────────────────────────────────
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

      // Auto-correct time drift between backing track and vocals
      if (vocalRef.current && currentSong?.vocalUrl) {
        if (cur < vocalOffset) {
          if (!vocalRef.current.paused) vocalRef.current.pause();
        } else {
          if (isPlaying && vocalRef.current.paused) {
            safePlay(vocalRef.current);
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

  // ── Play / Pause button — directly triggers user gesture chain ────────────
  const handlePlayPause = useCallback(() => {
    // On mobile the button tap IS the user gesture — unlock here too
    if (!_audioUnlocked && audioRef.current) {
      unlockAudio(audioRef.current);
      // Re-call after short delay to let unlock settle
      setTimeout(() => onTogglePlay(!isPlaying), 120);
      return;
    }
    onTogglePlay(!isPlaying);
  }, [isPlaying, onTogglePlay]);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentSong) return null;

  return (
    <div className="player-bar glass-panel">
      {/* Music track — playsInline is critical for iOS inline playback */}
      <audio
        ref={audioRef}
        src={currentSong?.audioUrl || undefined}
        playsInline
        preload="auto"
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
          playsInline
          preload="auto"
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
            onClick={handlePlayPause}
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
        {currentSong.audioUrl && (
          <button
            className="action-btn"
            onClick={() => triggerDownload(currentSong.audioUrl, currentSong.title)}
            title="Download MP3"
          >
            ⬇️ MP3
          </button>
        )}

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
          flex-shrink: 0;
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
          /* Larger tap target for mobile */
          padding: 8px;
          margin: -8px;
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
          /* Larger tap target for mobile */
          padding: 10px;
          box-sizing: content-box;
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
          padding: 6px;
          margin: -6px;
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

        /* ── Mobile player layout ─────────────────────────────────── */
        @media (max-width: 768px) {
          .player-bar {
            left: 0;
            right: 0;
            bottom: calc(var(--mobile-nav-height, 64px) + env(safe-area-inset-bottom, 0px));
            height: var(--mobile-player-height, 72px);
            padding: 0 14px;
            z-index: 100;
            box-sizing: border-box;
          }

          .song-info {
            width: auto;
            flex: 1;
            min-width: 0;
          }

          .song-artwork {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }

          .song-title {
            font-size: 13px;
          }

          .player-center {
            flex: none;
          }

          .timeline-container {
            display: none;
          }

          .player-right {
            width: auto;
            gap: 10px;
          }

          .action-btn {
            display: none;
          }

          .volume-slider {
            display: none;
          }

          .lyrics-popover {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: calc(var(--mobile-nav-height, 64px) + var(--mobile-player-height, 72px) + 16px + env(safe-area-inset-bottom, 0px));
            width: auto;
            max-height: 55vh;
            z-index: 150;
          }
        }
      `}</style>
    </div>
  );
}
