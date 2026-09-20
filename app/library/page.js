'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import SongCard from '../../components/SongCard';
import { getSongs, deleteSong, clearAllUserSongs } from '../../lib/songStorage';
import { usePlayer } from '../../context/PlayerContext';
import { toast } from '../../components/Toast';
import { triggerDownload } from '../../lib/download';

const SORT_OPTIONS = [
  { value: 'newest', label: '🕒 Newest' },
  { value: 'oldest', label: '📅 Oldest' },
  { value: 'title',  label: '🔤 A–Z' },
  { value: 'genre',  label: '🎵 Genre' },
];

export default function LibraryPage() {
  const { onPlaySong, currentSong, isPlaying } = usePlayer();
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [activeGenre, setActiveGenre] = useState('All');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    setSongs(getSongs());
  }, []);

  // Unique genres in library
  const genres = useMemo(() => {
    const g = ['All', ...new Set(songs.map((s) => s.genre).filter(Boolean))];
    return g;
  }, [songs]);

  // Library stats
  const stats = useMemo(() => ({
    total: songs.length,
    withVocals: songs.filter((s) => s.hasVocals || s.vocalUrl).length,
    totalDuration: songs.reduce((acc, s) => acc + (parseInt(s.duration, 10) || 0), 0),
  }), [songs]);

  // Filter + sort
  const filteredSongs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return songs
      .filter((song) => {
        const matchesGenre = activeGenre === 'All' || song.genre === activeGenre;
        const matchesSearch =
          !q ||
          song.title?.toLowerCase().includes(q) ||
          song.prompt?.toLowerCase().includes(q) ||
          song.genre?.toLowerCase().includes(q);
        return matchesGenre && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'title')  return a.title.localeCompare(b.title);
        if (sortBy === 'genre')  return (a.genre || '').localeCompare(b.genre || '');
        return 0;
      });
  }, [songs, searchQuery, activeGenre, sortBy]);

  const handleDelete = (id, e) => {
    e?.stopPropagation();
    deleteSong(id);
    setSongs(getSongs());
    setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    toast.success('Track removed from library.');
  };

  const handlePlayAll = () => {
    if (filteredSongs.length === 0) return;
    onPlaySong(filteredSongs[0], filteredSongs);
    toast.info(`Playing ${filteredSongs.length} tracks`);
  };

  const handleClearAll = () => {
    if (!confirm('Clear your entire music library? This cannot be undone.')) return;
    clearAllUserSongs();
    setSongs([]);
    toast.success('Library cleared.');
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const handleBulkDelete = () => {
    if (!confirm(`Delete ${selectedIds.size} selected track(s)?`)) return;
    selectedIds.forEach((id) => deleteSong(id));
    setSongs(getSongs());
    setSelectedIds(new Set());
    setBulkMode(false);
    toast.success(`${selectedIds.size} track(s) deleted.`);
  };

  const formatDuration = (secs) => {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  return (
    <div className="library-page">
      {/* Header */}
      <div className="library-header animate-fade-in-up">
        <div>
          <h1 className="page-title">My Music Library</h1>
          <p className="page-subtitle">All your generated songs and compositions in one place.</p>
        </div>
        <Link href="/create" className="glow-button">
          <span>✨ Create New Track</span>
        </Link>
      </div>

      {/* Stats Banner */}
      {songs.length > 0 && (
        <div className="stats-banner animate-fade-in-up">
          <div className="stat-card glass-panel">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Tracks</span>
          </div>
          <div className="stat-card glass-panel">
            <span className="stat-value">{formatDuration(stats.totalDuration)}</span>
            <span className="stat-label">Total Duration</span>
          </div>
          <div className="stat-card glass-panel">
            <span className="stat-value">{genres.length - 1}</span>
            <span className="stat-label">Genres</span>
          </div>
          <div className="stat-card glass-panel">
            <span className="stat-value">{stats.withVocals}</span>
            <span className="stat-label">With Vocals</span>
          </div>
        </div>
      )}

      {/* Controls Row */}
      <div className="controls-row animate-fade-in-up">
        <div className="search-box glass-panel">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            id="library-search"
            placeholder="Search by title, prompt, or genre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className="sort-controls glass-panel">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`sort-btn ${sortBy === opt.value ? 'active' : ''}`}
              onClick={() => setSortBy(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genre Filter Tabs */}
      {songs.length > 0 && (
        <div className="genre-tabs animate-fade-in-up">
          {genres.map((g) => (
            <button
              key={g}
              className={`genre-tab ${activeGenre === g ? 'active' : ''}`}
              onClick={() => setActiveGenre(g)}
            >
              {g}
              {g !== 'All' && (
                <span className="genre-count">
                  {songs.filter((s) => s.genre === g).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {songs.length > 0 && (
        <div className="action-toolbar animate-fade-in-up">
          <div className="toolbar-left">
            <span className="results-count">
              {filteredSongs.length} {filteredSongs.length === 1 ? 'track' : 'tracks'}
              {activeGenre !== 'All' ? ` in ${activeGenre}` : ''}
            </span>
          </div>
          <div className="toolbar-right">
            {filteredSongs.length > 0 && (
              <button className="toolbar-btn play-all-btn" onClick={handlePlayAll}>
                ▶ Play All
              </button>
            )}
            <button
              className={`toolbar-btn ${bulkMode ? 'active' : ''}`}
              onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}
            >
              {bulkMode ? '✕ Cancel' : '☑ Select'}
            </button>
            {bulkMode && selectedIds.size > 0 && (
              <button className="toolbar-btn delete-bulk-btn" onClick={handleBulkDelete}>
                🗑️ Delete ({selectedIds.size})
              </button>
            )}
            {songs.length > 0 && !bulkMode && (
              <button className="toolbar-btn danger-btn" onClick={handleClearAll}>
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Library Grid or Empty State */}
      {filteredSongs.length > 0 ? (
        <div className="library-grid animate-fade-in-up">
          {filteredSongs.map((song, index) => (
            <div
              key={song.id}
              className={`library-card-wrapper ${bulkMode ? 'bulk-mode' : ''} ${selectedIds.has(song.id) ? 'selected' : ''}`}
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              {bulkMode && (
                <button
                  className="select-checkbox"
                  onClick={() => toggleSelect(song.id)}
                  aria-label="Select track"
                >
                  {selectedIds.has(song.id) ? '✅' : '⬜'}
                </button>
              )}
              <SongCard
                song={song}
                isPlaying={isPlaying && currentSong?.id === song.id}
                onPlay={(s) => {
                  if (bulkMode) { toggleSelect(s.id); return; }
                  onPlaySong(s, filteredSongs);
                }}
              />
              {!bulkMode && (
                <div className="card-top-actions">
                  <button
                    className="card-action-icon download-lib-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerDownload(song.audioUrl, song.title);
                    }}
                    title="Download MP3"
                    aria-label="Download MP3"
                  >
                    ⬇️
                  </button>
                  <button
                    className="card-action-icon delete-song-btn"
                    onClick={(e) => handleDelete(song.id, e)}
                    title="Delete track"
                    aria-label="Delete track"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-library glass-panel animate-scale-in">
          <div className="empty-orbs">
            <div className="e-orb e-orb-1" />
            <div className="e-orb e-orb-2" />
          </div>
          <div className="empty-icon">🎵</div>
          <h2>{searchQuery || activeGenre !== 'All' ? 'No matching songs found' : "Your Library is Empty"}</h2>
          <p>
            {searchQuery || activeGenre !== 'All'
              ? 'Try a different search or genre filter.'
              : "You haven't generated any songs yet. Head to the Create Studio to start making music!"}
          </p>
          {!searchQuery && activeGenre === 'All' && (
            <Link href="/create" className="glow-button" style={{ marginTop: 12 }}>
              <span>✨ Make Your First Song</span>
            </Link>
          )}
        </div>
      )}

      <style jsx>{`
        .library-page {
          padding: 32px 40px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        @media (max-width: 768px) {
          .library-page { padding: 20px 16px; gap: 16px; }
        }

        .library-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
        }

        .page-title {
          font-family: var(--font-heading);
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.3px;
        }

        .page-subtitle {
          color: var(--text-muted);
          font-size: 14px;
          margin-top: 4px;
        }

        /* Stats */
        .stats-banner {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        @media (max-width: 640px) {
          .stats-banner { grid-template-columns: repeat(2, 1fr); }
        }

        .stat-card {
          border-radius: var(--radius-md);
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: border-color 0.2s ease;
        }

        .stat-card:hover { border-color: rgba(124, 58, 237, 0.3); }

        .stat-value {
          font-family: var(--font-heading);
          font-size: 24px;
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .stat-label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* Controls */
        .controls-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 220px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          border-radius: var(--radius-md);
        }

        .search-icon { font-size: 15px; color: var(--text-muted); }

        .search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          padding: 13px 0;
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
        }

        .search-input::placeholder { color: var(--text-muted); }

        .clear-search {
          font-size: 12px;
          color: var(--text-muted);
          padding: 2px 6px;
          border-radius: 50%;
          transition: color 0.15s ease;
        }

        .clear-search:hover { color: var(--text-primary); }

        .sort-controls {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px;
          border-radius: var(--radius-md);
          flex-wrap: wrap;
        }

        .sort-btn {
          padding: 7px 13px;
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          transition: all 0.18s ease;
          white-space: nowrap;
        }

        .sort-btn:hover { color: var(--text-primary); }

        .sort-btn.active {
          background: var(--gradient-primary);
          color: #fff;
          box-shadow: 0 2px 10px var(--accent-purple-glow);
        }

        /* Genre Tabs */
        .genre-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }

        .genre-tabs::-webkit-scrollbar { display: none; }

        .genre-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: var(--radius-full);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.03);
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .genre-tab:hover {
          color: var(--text-primary);
          border-color: var(--border-color);
        }

        .genre-tab.active {
          background: rgba(124, 58, 237, 0.15);
          border-color: rgba(124, 58, 237, 0.4);
          color: #c4b5fd;
        }

        .genre-count {
          font-size: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-full);
          padding: 1px 6px;
          font-weight: 700;
        }

        /* Action toolbar */
        .action-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .toolbar-left { display: flex; align-items: center; gap: 12px; }
        .toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .results-count {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .toolbar-btn {
          padding: 7px 14px;
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 600;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.04);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .toolbar-btn:hover {
          border-color: rgba(255, 255, 255, 0.2);
          color: var(--text-primary);
        }

        .toolbar-btn.active {
          background: rgba(124, 58, 237, 0.15);
          border-color: var(--accent-purple);
          color: #c4b5fd;
        }

        .play-all-btn {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.35);
          color: #6ee7b7;
        }

        .play-all-btn:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: var(--accent-green);
        }

        .delete-bulk-btn {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fca5a5;
        }

        .danger-btn {
          color: var(--text-muted);
          border-color: transparent;
          font-size: 11px;
        }

        .danger-btn:hover {
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.35);
          background: rgba(239, 68, 68, 0.08);
        }

        /* Grid */
        .library-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .library-card-wrapper {
          position: relative;
          animation: fadeInUp 0.4s ease both;
        }

        .library-card-wrapper.selected > :global(.song-card) {
          border-color: rgba(124, 58, 237, 0.5);
          box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.25);
        }

        .library-card-wrapper.bulk-mode > :global(.song-card) {
          cursor: pointer;
        }

        .select-checkbox {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 20;
          font-size: 18px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          transition: transform 0.15s ease;
        }

        .select-checkbox:hover { transform: scale(1.15); }

        .card-top-actions {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .library-card-wrapper:hover .card-top-actions { opacity: 1; }

        @media (max-width: 768px) {
          .card-top-actions { opacity: 1 !important; }
        }

        .card-action-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .card-action-icon:hover { transform: scale(1.15); }

        .download-lib-btn:hover {
          background: rgba(124, 58, 237, 0.85);
        }

        .delete-song-btn:hover {
          background: rgba(239, 68, 68, 0.85);
        }

        /* Empty */
        .empty-library {
          border-radius: var(--radius-xl);
          padding: 90px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 14px;
          position: relative;
          overflow: hidden;
          min-height: 380px;
        }

        .empty-orbs {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .e-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          animation: orbFloat 10s ease-in-out infinite;
        }

        .e-orb-1 {
          width: 260px;
          height: 260px;
          background: rgba(124, 58, 237, 0.1);
          top: -80px;
          right: -80px;
        }

        .e-orb-2 {
          width: 200px;
          height: 200px;
          background: rgba(236, 72, 153, 0.08);
          bottom: -50px;
          left: -50px;
          animation-delay: -5s;
        }

        .empty-icon {
          font-size: 64px;
          position: relative;
          z-index: 1;
        }

        .empty-library h2 {
          font-family: var(--font-heading);
          font-size: 24px;
          font-weight: 800;
          position: relative;
          z-index: 1;
        }

        .empty-library p {
          color: var(--text-muted);
          max-width: 400px;
          line-height: 1.6;
          font-size: 14px;
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
