'use me';

export default function LoadingAnimation({ statusText = 'Generating your AI music track...' }) {
  return (
    <div className="loading-container glass-panel">
      <div className="spinner-glow">
        <div className="inner-ring" />
        <div className="outer-ring" />
        <div className="center-icon">🎵</div>
      </div>

      <h3 className="loading-title">{statusText}</h3>
      <p className="loading-subtitle">Our AI neural models are composing, mixing, and mastering your track.</p>

      <div className="progress-pills">
        <span className="pill step-done">✓ Lyric Composition</span>
        <span className="pill step-active">⚡ Audio Synthesis</span>
        <span className="pill step-pending">⌛ Mastering</span>
      </div>

      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 40px;
          border-radius: var(--radius-lg);
          text-align: center;
          gap: 20px;
          background: rgba(18, 18, 28, 0.85);
        }

        .spinner-glow {
          position: relative;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .center-icon {
          font-size: 36px;
          z-index: 2;
          animation: pulse 1.5s ease-in-out infinite alternate;
        }

        .inner-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: var(--accent-pink);
          border-bottom-color: var(--accent-cyan);
          animation: spinSlow 1.5s linear infinite;
        }

        .outer-ring {
          position: absolute;
          inset: -12px;
          border-radius: 50%;
          border: 2px dashed rgba(124, 58, 237, 0.5);
          animation: spinSlow 4s linear infinite reverse;
        }

        @keyframes pulse {
          0% { transform: scale(0.9); }
          100% { transform: scale(1.15); }
        }

        .loading-title {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .loading-subtitle {
          font-size: 14px;
          color: var(--text-muted);
          max-width: 400px;
          line-height: 1.5;
        }

        .progress-pills {
          display: flex;
          gap: 12px;
          margin-top: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .pill {
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: var(--radius-full);
        }

        .step-done {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .step-active {
          background: rgba(124, 58, 237, 0.2);
          color: var(--accent-pink);
          border: 1px solid var(--accent-purple);
          animation: pulsePill 1.2s ease-in-out infinite alternate;
        }

        .step-pending {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          border: 1px solid var(--border-color);
        }

        @keyframes pulsePill {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
