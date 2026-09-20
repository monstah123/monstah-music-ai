'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function SongCard({ song, isPlaying, onPlay }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(song.likes || 0);

  const toggleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <div className="song-card glass-panel" onClick={() => onPlay(song)}>
      {/* Artwork Box */}
      <div
        className="card-artwork"
        style={{ background: song.coverGradient || 'var(--gradient-primary)' }}
      >
        <div className="artwork-overlay">
          <button className="play-overlay-btn">
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>

        <span className="genre-badge">{song.genre || 'AI Track'}</span>
        {(song.hasVocals || song.vocalUrl) && (
          <span className="vocal-badge" title="Includes AI Vocals">🎤 Vocals</span>
        )}
        <span className="duration-badge">{song.duration}s</span>
      </div>

      {/* Details */}
      <div className="card-body">
        <div className="title-row">
          <Link href={`/song/${song.id}`} className="card-title" onClick={(e) => e.stopPropagation()}>
            {song.title}
          </Link>
          <button
            className={`like-btn ${isLiked ? 'liked' : ''}`}
            onClick={toggleLike}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            {isLiked ? '❤️' : '🤍'}
          </button>
        </div>

        <p className="card-prompt">{song.prompt}</p>

        <div className="card-footer">
          <span className="creator-info">
            <span className="avatar">{song.userAvatar || '⚡'}</span>
            <span className="username">{song.userName || 'Creator'}</span>
          </span>

          <div className="stats-info">
            <span>▶ {likeCount > 1000 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .song-card {
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }

        .song-card:hover {
          transform: translateY(-6px);
          border-color: rgba(124, 58, 237, 0.4);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
        }

        .card-artwork {
          height: 180px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .artwork-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .song-card:hover .artwork-overlay {
          opacity: 1;
        }

        .play-overlay-btn {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: var(--gradient-primary);
          color: #fff;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px var(--accent-purple-glow);
          transform: scale(0.9);
          transition: transform 0.2s ease;
        }

        .song-card:hover .play-overlay-btn {
          transform: scale(1);
        }

        .genre-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          color: var(--text-primary);
        }

        .vocal-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          background: rgba(124, 58, 237, 0.7);
          backdrop-filter: blur(8px);
          color: #fff;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
        }

        .duration-badge {
          position: absolute;
          bottom: 12px;
          right: 12px;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          background: rgba(0, 0, 0, 0.7);
          color: var(--text-secondary);
        }

        .card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-title {
          font-family: var(--font-heading);
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-title:hover {
          color: var(--accent-pink);
        }

        .like-btn {
          font-size: 14px;
          transition: transform 0.2s ease;
        }

        .like-btn:hover {
          transform: scale(1.2);
        }

        .card-prompt {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 34px;
        }

        .card-footer {
          margin-top: auto;
          padding-top: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .creator-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .avatar {
          font-size: 14px;
        }

        .username {
          font-weight: 500;
        }

        .stats-info {
          color: var(--text-muted);
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}
