'use me';

export default function GenreTag({ genre, isSelected, onClick }) {
  return (
    <button
      className={`genre-tag ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(genre)}
      type="button"
    >
      <span className="genre-emoji">{genre.emoji}</span>
      <span className="genre-name">{genre.name}</span>

      <style jsx>{`
        .genre-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }

        .genre-tag:hover {
          color: var(--text-primary);
          border-color: rgba(124, 58, 237, 0.5);
          background: rgba(124, 58, 237, 0.12);
          transform: translateY(-2px);
        }

        .genre-tag.selected {
          color: #fff;
          background: var(--gradient-primary);
          border-color: transparent;
          box-shadow: 0 4px 16px var(--accent-purple-glow);
          transform: translateY(-2px);
        }

        .genre-emoji {
          font-size: 14px;
        }
      `}</style>
    </button>
  );
}
