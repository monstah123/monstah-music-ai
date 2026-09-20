'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WaveformVisualizer from '../../../components/WaveformVisualizer';
import { getSongById, deleteSong } from '../../../lib/songStorage';
import { TRENDING_SONGS } from '../../../lib/mockData';
import { usePlayer } from '../../../context/PlayerContext';
import { toast } from '../../../components/Toast';
import { triggerDownload } from '../../../lib/download';

// Render lyrics with highlighted section headers
function StructuredLyrics({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="lyrics-structured">
      {lines.map((line, i) => {
        const isSectionHeader = /^\[(.*?)\]$/.test(line.trim());
        if (isSectionHeader) {
          return (
            <div key={i} className="lyric-section-header">
              {line.trim()}
            </div>
          );
        }
        if (line.trim() === '') {
          return <div key={i} className="lyric-spacer" />;
        }
        return (
          <p key={i} className="lyric-line">
            {line}
          </p>
        );
      })}
    </div>
  );
}

export default function SongDetailPage({ params }) {
  // In Next.js 15, params is a Promise; unwrap it if needed
  const resolvedParams = typeof params?.then === 'function' ? use(params) : params;
  const songId = resolvedParams?.id;

  const { onPlaySong, currentSong, isPlaying } = usePlayer();
  const router = useRouter();
  const [song, setSong] = useState(null);
  const [relatedSongs, setRelatedSongs] = useState([]);

  useEffect(() => {
    if (!songId) return;
    const stored = getSongById(songId);
    if (stored) {
      setSong(stored);
    } else {
      const mock = TRENDING_SONGS.find((s) => s.id === songId);
      if (mock) setSong(mock);
    }
  }, [songId]);

  // Find related songs from trending with same genre
  useEffect(() => {
    if (!song) return;
    const related = TRENDING_SONGS.filter(
      (s) => s.id !== song.id && s.genre === song.genre
    ).slice(0, 3);
    setRelatedSongs(related);
  }, [song]);

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Song link copied to clipboard!');
  };

  const handleDelete = () => {
    if (confirm(`Delete "${song.title}"?`)) {
      deleteSong(song.id);
      toast.success('Track deleted from your library.');
      router.push('/library');
    }
  };

  const handleRegenerate = () => {
    const params = new URLSearchParams({
      prompt: song.prompt || '',
      genre:  song.genre  || '',
    });
    router.push(`/create?${params.toString()}`);
  };

  if (!song) {
    return (
      <div className="song-detail-page">
        <div className="not-found glass-panel animate-fade-in-up">
          <div style={{ fontSize: 48 }}>🎵</div>
          <h2>Song Not Found</h2>
          <p>The song you're looking for doesn't exist or has been removed.</p>
          <Link href="/" className="glow-button" style={{ marginTop: 8 }}>
            <span>← Back to Explore</span>
          </Link>
        </div>
      </div>
    );
  }

  const isCurrentPlaying = isPlaying && currentSong?.id === song.id;

  const lyricsText = song.lyrics
    ? typeof song.lyrics === 'string'
      ? song.lyrics
      : song.lyrics.lyrics
    : null;

  return (
    <div className="song-detail-page animate-fade-in-up">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/" className="breadcrumb-link">Explore</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{song.title}</span>
      </div>

      {/* Hero Card */}
      <div
        className="detail-hero glass-panel"
        style={{
          backgroundImage: `radial-gradient(ellipse at top left, ${
            song.coverGradient
              ? song.coverGradient.replace('linear-gradient(135deg, ', '').replace(' 100%)', ' 30%, transparent 70%)')
              : 'rgba(124,58,237,0.2) 0%, transparent 70%'
          })`,
        }}
      >
        {/* Artwork */}
        <div
          className="detail-artwork"
          style={{ background: song.coverGradient || 'var(--gradient-primary)' }}
        >
          <button
            className={`play-hero-btn ${isCurrentPlaying ? 'playing' : ''}`}
            onClick={() => onPlaySong(song)}
            aria-label={isCurrentPlaying ? 'Pause' : 'Play'}
          >
            {isCurrentPlaying ? '⏸' : '▶'}
          </button>
        </div>

        {/* Info */}
        <div className="detail-info">
          <div className="detail-top-row">
            <div className="detail-pills">
              <span className="d-pill genre-pill">{song.genre || 'AI Track'}</span>
              {song.mood && (
                <span className="d-pill mood-pill">{song.mood}</span>
              )}
              {(song.hasVocals || song.vocalUrl) && (
                <span className="d-pill vocal-pill">🎤 AI Vocals</span>
              )}
              {song.isDemoMode && (
                <span className="d-pill demo-pill">ℹ️ Preview</span>
              )}
            </div>
          </div>

          <h1 className="detail-title">{song.title}</h1>
          <p className="detail-prompt">"{song.prompt}"</p>

          {/* Meta Stats */}
          <div className="detail-meta">
            <div className="meta-item">
              <span className="meta-icon">👤</span>
              <span>{song.userName || 'You'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">⏱</span>
              <span>{song.duration}s</span>
            </div>
            {song.bpm && (
              <div className="meta-item">
                <span className="meta-icon">♩</span>
                <span>{song.bpm} BPM</span>
              </div>
            )}
            {song.createdAt && (
              <div className="meta-item">
                <span className="meta-icon">📅</span>
                <span>{new Date(song.createdAt).toLocaleDateString()}</span>
              </div>
            )}
            {song.model && (
              <div className="meta-item">
                <span className="meta-icon">🤖</span>
                <span>{song.model}</span>
              </div>
            )}
          </div>

          {/* Waveform */}
          <div className="detail-waveform">
            <WaveformVisualizer isPlaying={isCurrentPlaying} height={42} barCount={60} />
          </div>

          {/* Actions */}
          <div className="detail-actions">
            <button
              className="glow-button play-action-btn"
              onClick={() => onPlaySong(song)}
            >
              <span>{isCurrentPlaying ? '⏸ Pause' : '▶ Play Song'}</span>
            </button>

            {song.audioUrl && (
              <button
                type="button"
                className="action-btn download-btn"
                onClick={() => triggerDownload(song.audioUrl, song.title)}
              >
                ⬇️ Download MP3
              </button>
            )}

            <button className="action-btn" onClick={handleShareLink}>
              🔗 Share
            </button>

            <button className="action-btn regenerate-btn" onClick={handleRegenerate}>
              🔄 Re-generate
            </button>

            {!song.isMock && (
              <button className="action-btn delete-btn" onClick={handleDelete}>
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lyrics Section */}
      {lyricsText && (
        <div className="lyrics-section glass-panel animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="lyrics-header">
            <h2>📜 Song Lyrics</h2>
            <div className="lyrics-meta-tags">
              {song.lyrics?.mood && (
                <span className="d-pill mood-pill">{song.lyrics.mood}</span>
              )}
              {song.lyrics?.bpm_suggestion && (
                <span className="d-pill bpm-pill">♩ {song.lyrics.bpm_suggestion} BPM</span>
              )}
            </div>
          </div>
          <StructuredLyrics text={lyricsText} />
        </div>
      )}

      {/* Related Songs */}
      {relatedSongs.length > 0 && (
        <div className="related-section animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="section-title">More {song.genre} Tracks</h2>
          <div className="related-grid">
            {relatedSongs.map((related) => (
              <Link
                key={related.id}
                href={`/song/${related.id}`}
                className="related-card glass-panel"
              >
                <div
                  className="related-artwork"
                  style={{ background: related.coverGradient || 'var(--gradient-primary)' }}
                >
                  <span>🎵</span>
                </div>
                <div className="related-info">
                  <p className="related-title">{related.title}</p>
                  <p className="related-meta">{related.genre} • {related.duration}s</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .song-detail-page {
          padding: 32px 40px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .breadcrumb-link {
          color: var(--text-muted);
          transition: color 0.2s ease;
        }

        .breadcrumb-link:hover { color: var(--accent-pink); }

        .breadcrumb-sep { color: var(--text-muted); }

        .breadcrumb-current {
          color: var(--text-secondary);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 300px;
        }

        .detail-hero {
          border-radius: var(--radius-xl);
          padding: 36px;
          display: flex;
          gap: 36px;
          align-items: flex-start;
          border-color: rgba(124, 58, 237, 0.2);
        }

        @media (max-width: 768px) {
          .song-detail-page { padding: 20px 16px; }
          .detail-hero { flex-direction: column; gap: 24px; }
          .detail-title { font-size: 28px; }
        }

        .detail-artwork {
          width: 210px;
          height: 210px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.65);
        }

        @media (max-width: 768px) {
          .detail-artwork { width: 100%; height: 200px; }
        }

        .play-hero-btn {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(12px);
          color: #fff;
          font-size: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 32px rgba(0, 0, 0, 0.4);
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .play-hero-btn:hover {
          transform: scale(1.1);
          background: rgba(255, 255, 255, 0.3);
        }

        .play-hero-btn.playing {
          animation: pulseGlow 2s ease-in-out infinite;
        }

        .detail-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 0;
        }

        .detail-top-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .detail-pills, .lyrics-meta-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .d-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          letter-spacing: 0.3px;
          text-transform: capitalize;
        }

        .genre-pill { background: rgba(124,58,237,0.2); color: #c4b5fd; }
        .mood-pill  { background: rgba(236,72,153,0.15); color: #f9a8d4; }
        .vocal-pill { background: rgba(124,58,237,0.25); color: #e9d5ff; }
        .demo-pill  { background: rgba(245,158,11,0.15); color: var(--accent-amber); }
        .bpm-pill   { background: rgba(245,158,11,0.12); color: var(--accent-amber); }

        .detail-title {
          font-family: var(--font-heading);
          font-size: 36px;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.5px;
        }

        .detail-prompt {
          font-size: 14px;
          color: var(--text-muted);
          font-style: italic;
          line-height: 1.5;
        }

        .detail-meta {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .meta-icon { font-size: 14px; }

        .detail-waveform { margin: 4px 0; }

        .detail-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        :global(.play-action-btn) {
          padding: 12px 24px;
          font-size: 14px;
        }

        .action-btn {
          padding: 10px 18px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255,255,255,0.2);
        }

        .regenerate-btn:hover {
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.1);
        }

        .delete-btn:hover {
          border-color: rgba(239, 68, 68, 0.5);
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.1);
        }

        /* Lyrics */
        .lyrics-section {
          border-radius: var(--radius-lg);
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .lyrics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .lyrics-header h2 {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 800;
        }

        :global(.lyrics-structured) {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        :global(.lyric-section-header) {
          font-size: 11px;
          font-weight: 800;
          color: var(--accent-purple);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-top: 20px;
          margin-bottom: 8px;
          padding: 4px 10px;
          background: rgba(124, 58, 237, 0.1);
          border-radius: var(--radius-sm);
          width: fit-content;
        }

        :global(.lyric-line) {
          font-size: 14px;
          line-height: 1.85;
          color: var(--text-secondary);
          padding-left: 4px;
        }

        :global(.lyric-spacer) {
          height: 8px;
        }

        /* Related songs */
        .related-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-title {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 800;
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }

        .related-card {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 12px;
          border-radius: var(--radius-md);
          transition: all 0.2s ease;
        }

        .related-card:hover {
          border-color: rgba(124, 58, 237, 0.3);
          transform: translateY(-2px);
        }

        .related-artwork {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .related-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          overflow: hidden;
        }

        .related-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .related-meta {
          font-size: 11px;
          color: var(--text-muted);
        }

        .not-found {
          padding: 80px 40px;
          border-radius: var(--radius-xl);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .not-found h2 {
          font-family: var(--font-heading);
          font-size: 24px;
        }

        .not-found p {
          color: var(--text-muted);
          font-size: 15px;
        }
      `}</style>
    </div>
  );
}
