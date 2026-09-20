'use client';
import { useState } from 'react';
import CreatePanel from '../../components/CreatePanel';
import LoadingAnimation from '../../components/LoadingAnimation';
import WaveformVisualizer from '../../components/WaveformVisualizer';
import { saveSong } from '../../lib/songStorage';
import { usePlayer } from '../../context/PlayerContext';
import { toast } from '../../components/Toast';

export default function CreatePage() {
  const { onPlaySong, currentSong, isPlaying } = usePlayer();
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [generatedSong, setGeneratedSong] = useState(null);

  const safeParseJsonResponse = async (res) => {
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      if (!res.ok) throw new Error(`Server request failed (${res.status}). Please check network or retry.`);
      throw new Error('Server returned unexpected response.');
    }
    if (!res.ok) throw new Error(data.error || data.message || 'Server error');
    return data;
  };

  const handleGenerate = async (params) => {
    setIsLoading(true);
    setErrorMsg(null);
    setGeneratedSong(null);

    try {
      // Step 1: Generate Lyrics & Metadata via Gemini
      setStatusText('✍️ Writing song lyrics and structuring verse/chorus...');
      let lyricsData = {};
      try {
        const lyricsRes = await fetch('/api/lyrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: params.prompt, genre: params.genre }),
        });
        lyricsData = await safeParseJsonResponse(lyricsRes);
      } catch (lErr) {
        console.warn('Lyrics generation error (proceeding with fallback):', lErr.message);
        lyricsData = { lyrics: '', title: params.prompt.slice(0, 30) };
      }

      // Step 2: Generate Music Track (Stable Audio 2.5)
      setStatusText(
        params.includeVocals
          ? '🎙️ Synthesizing backing track & AI vocal stem via ElevenLabs...'
          : `⚡ Generating ${params.duration}s studio-quality track with Stable Audio 2.5...`
      );

      const musicRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:         params.prompt,
          duration:       params.duration,
          genre:          params.genre,
          styleTags:      params.styleTags,
          includeVocals:  params.includeVocals,
          lyricsText:     lyricsData.lyrics || '',
          voicePreset:    params.voicePreset || 'male_singer',
          bpmSuggestion:  params.bpmHint || lyricsData.bpm_suggestion || '',
        }),
      });

      const musicData = await safeParseJsonResponse(musicRes);

      // Show demo mode warning as toast, not error banner
      if (musicData.isDemoMode && musicData.message) {
        toast.info(musicData.message);
      }

      // Assemble final song object
      const songTitle = params.customTitle || lyricsData.title || params.prompt.slice(0, 30);

      const gradients = [
        'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
        'linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)',
        'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
        'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
        'linear-gradient(135deg, #dc2626 0%, #7c3aed 100%)',
        'linear-gradient(135deg, #0891b2 0%, #10b981 100%)',
      ];
      const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

      const songObj = {
        title:         songTitle,
        prompt:        params.prompt,
        genre:         params.genre,
        duration:      musicData.duration || params.duration,
        audioUrl:      musicData.audioUrl,
        vocalUrl:      musicData.vocalUrl || null,
        hasVocals:     musicData.hasVocals || false,
        lyrics:        lyricsData,
        coverGradient: randomGradient,
        createdAt:     new Date().toISOString(),
        userName:      'You',
        userAvatar:    '👑',
        isDemoMode:    musicData.isDemoMode,
        mood:          lyricsData.mood,
        bpm:           lyricsData.bpm_suggestion || params.bpmHint,
        model:         musicData.model || 'stable-audio-2.5',
      };

      const saved = saveSong(songObj);
      setGeneratedSong(saved || songObj);

      if (onPlaySong) onPlaySong(saved || songObj);

      toast.success(`"${songTitle}" generated successfully!`);
    } catch (err) {
      console.error('Generation Error:', err);
      setErrorMsg(err.message || 'An error occurred during generation.');
      toast.error(err.message || 'Generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-page animate-fade-in-up">
      <div className="page-header">
        <div className="header-badge">⚡ Stable Audio 2.5</div>
        <h1 className="page-title">AI Music Generation Studio</h1>
        <p className="page-subtitle">
          Generate up to 2 minutes of professional studio-quality music in seconds.
        </p>
      </div>

      {errorMsg && (
        <div className="error-banner">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}>✕</button>
        </div>
      )}

      <div className="studio-grid">
        {/* Creation Input Panel */}
        <div className="panel-col">
          <CreatePanel onGenerate={handleGenerate} isLoading={isLoading} />
        </div>

        {/* Right Output Side */}
        <div className="output-col">
          {isLoading ? (
            <LoadingAnimation statusText={statusText} />
          ) : generatedSong ? (
            <div className="result-card glass-panel animate-scale-in">
              <div className="result-header">
                <div className="badge-new">✨ GENERATED TRACK</div>
                <div className="result-pills">
                  {generatedSong.hasVocals && <span className="vocal-pill">🎤 AI Vocals</span>}
                  {generatedSong.isDemoMode && <span className="demo-pill">ℹ️ Preview Mode</span>}
                  {generatedSong.model && (
                    <span className="model-pill">🎵 {generatedSong.model}</span>
                  )}
                </div>
              </div>

              <div className="song-preview-box">
                <div
                  className="preview-artwork"
                  style={{ background: generatedSong.coverGradient }}
                >
                  <button
                    className="play-big-btn"
                    onClick={() => onPlaySong(generatedSong)}
                  >
                    {isPlaying && currentSong?.id === generatedSong.id ? '⏸' : '▶'}
                  </button>
                </div>

                <div className="preview-info">
                  <h2>{generatedSong.title}</h2>
                  <div className="preview-tags">
                    <span className="tag-pill genre-tag">{generatedSong.genre}</span>
                    {generatedSong.mood && (
                      <span className="tag-pill mood-tag">{generatedSong.mood}</span>
                    )}
                    <span className="tag-pill dur-tag">{generatedSong.duration}s</span>
                    {generatedSong.bpm && (
                      <span className="tag-pill bpm-tag">♩ {generatedSong.bpm} BPM</span>
                    )}
                  </div>
                  <p className="preview-prompt">"{generatedSong.prompt}"</p>
                  <div className="visualizer-container">
                    <WaveformVisualizer
                      isPlaying={isPlaying && currentSong?.id === generatedSong.id}
                      height={36}
                    />
                  </div>
                </div>
              </div>

              {/* Lyrics Display */}
              {generatedSong.lyrics?.lyrics && (
                <div className="generated-lyrics-box">
                  <div className="lyrics-box-header">
                    <h4>📜 Song Lyrics & Concept (Gemini AI)</h4>
                    <span className="mood-tag-inline">
                      {generatedSong.lyrics.mood && `Mood: ${generatedSong.lyrics.mood}`}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '4px' }}>
                    💡 Stable Audio 2.5 generates studio instrumental beats & arrangements from your prompt.
                  </p>
                  <pre className="lyrics-text">
                    {typeof generatedSong.lyrics === 'string'
                      ? generatedSong.lyrics
                      : generatedSong.lyrics.lyrics}
                  </pre>
                </div>
              )}

              <div className="result-actions">
                <a
                  href={generatedSong.audioUrl}
                  download={`${generatedSong.title}.mp3`}
                  target="_blank"
                  rel="noreferrer"
                  className="glow-button download-btn"
                >
                  <span>⬇️ Download</span>
                </a>
                <button
                  className="share-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/song/${generatedSong.id}`
                    );
                    toast.success('Song link copied to clipboard!');
                  }}
                >
                  🔗 Share
                </button>
                <a
                  href={`/song/${generatedSong.id}`}
                  className="detail-btn"
                >
                  📄 Full Details
                </a>
              </div>
            </div>
          ) : (
            <div className="placeholder-box glass-panel">
              <div className="placeholder-orbs">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
              </div>
              <div className="placeholder-icon">🎧</div>
              <h3>Your Generated Track Will Appear Here</h3>
              <p>
                Pick a genre preset or describe your vibe on the left, then hit Generate.
                Powered by Stability AI Stable Audio 2.5.
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .create-page {
          padding: 32px 40px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .page-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.3);
          font-size: 11px;
          font-weight: 700;
          color: var(--accent-cyan);
          letter-spacing: 0.5px;
          width: fit-content;
          margin-bottom: 4px;
        }

        .page-title {
          font-family: var(--font-heading);
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.3px;
        }

        .page-subtitle {
          color: var(--text-muted);
          font-size: 15px;
        }

        .error-banner {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.35);
          padding: 14px 20px;
          border-radius: var(--radius-md);
          color: #fca5a5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .studio-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .studio-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .create-page { padding: 20px 16px; }
        }

        .output-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .placeholder-box {
          border-radius: var(--radius-lg);
          padding: 60px 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 16px;
          min-height: 420px;
          position: relative;
          overflow: hidden;
        }

        .placeholder-orbs {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          animation: orbFloat 8s ease-in-out infinite;
        }

        .orb-1 {
          width: 220px;
          height: 220px;
          background: rgba(124, 58, 237, 0.12);
          top: -60px;
          right: -60px;
        }

        .orb-2 {
          width: 180px;
          height: 180px;
          background: rgba(236, 72, 153, 0.1);
          bottom: -40px;
          left: -40px;
          animation-delay: -4s;
        }

        .placeholder-icon {
          font-size: 56px;
          position: relative;
          z-index: 1;
        }

        .placeholder-box h3 {
          font-family: var(--font-heading);
          font-size: 20px;
          position: relative;
          z-index: 1;
        }

        .placeholder-box p {
          color: var(--text-muted);
          font-size: 14px;
          max-width: 340px;
          line-height: 1.6;
          position: relative;
          z-index: 1;
        }

        .result-card {
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          border-color: rgba(124, 58, 237, 0.35);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .badge-new {
          font-size: 11px;
          font-weight: 700;
          color: var(--accent-pink);
          letter-spacing: 1.2px;
        }

        .result-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .vocal-pill, .demo-pill, .model-pill {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          font-weight: 600;
        }

        .vocal-pill {
          background: rgba(124, 58, 237, 0.2);
          color: #c4b5fd;
        }

        .demo-pill {
          background: rgba(245, 158, 11, 0.15);
          color: var(--accent-amber);
        }

        .model-pill {
          background: rgba(6, 182, 212, 0.12);
          color: var(--accent-cyan);
        }

        .song-preview-box {
          display: flex;
          gap: 18px;
          align-items: center;
        }

        .preview-artwork {
          width: 100px;
          height: 100px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }

        .play-big-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          color: #fff;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(0,0,0,0.4);
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .play-big-btn:hover {
          transform: scale(1.1);
          background: rgba(255,255,255,0.25);
        }

        .preview-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .preview-info h2 {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .preview-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .tag-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: var(--radius-full);
        }

        .genre-tag {
          background: rgba(124, 58, 237, 0.2);
          color: #c4b5fd;
        }

        .mood-tag {
          background: rgba(236, 72, 153, 0.15);
          color: #f9a8d4;
          text-transform: capitalize;
        }

        .dur-tag {
          background: rgba(6, 182, 212, 0.12);
          color: var(--accent-cyan);
        }

        .bpm-tag {
          background: rgba(245, 158, 11, 0.12);
          color: var(--accent-amber);
        }

        .preview-prompt {
          font-size: 12px;
          color: var(--text-muted);
          font-style: italic;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .visualizer-container { margin-top: 4px; }

        .generated-lyrics-box {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 220px;
          overflow-y: auto;
        }

        .lyrics-box-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .lyrics-box-header h4 {
          font-family: var(--font-heading);
          font-size: 13px;
          font-weight: 700;
        }

        .mood-tag-inline {
          font-size: 11px;
          color: var(--accent-cyan);
          text-transform: capitalize;
        }

        .lyrics-text {
          font-family: var(--font-body);
          font-size: 12px;
          line-height: 1.7;
          color: var(--text-secondary);
          white-space: pre-wrap;
        }

        .result-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        :global(.download-btn) {
          flex: 1;
          justify-content: center;
          padding: 12px;
          font-size: 14px;
          min-width: 120px;
        }

        .share-btn, .detail-btn {
          padding: 12px 18px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          transition: background 0.2s ease;
        }

        .share-btn:hover, .detail-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
