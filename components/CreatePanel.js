'use client';
import { useState } from 'react';
import GenreTag from './GenreTag';
import { GENRE_PRESETS } from '../lib/mockData';

export default function CreatePanel({ onGenerate, isLoading }) {
  const [mode, setMode] = useState('simple'); // 'simple' | 'custom'
  const [prompt, setPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [duration, setDuration] = useState(30);
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [includeVocals, setIncludeVocals] = useState(true);
  const [voicePreset, setVoicePreset] = useState('male_singer');
  const [styleTags, setStyleTags] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [bpmHint, setBpmHint] = useState('');

  const handleGenreClick = (genreObj) => {
    if (selectedGenre?.name === genreObj.name) {
      setSelectedGenre(null);
      if (mode === 'simple') setPrompt('');
    } else {
      setSelectedGenre(genreObj);
      setPrompt(genreObj.prompt);
      setStyleTags(genreObj.name.toLowerCase());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    onGenerate({
      prompt:       prompt.trim(),
      genre:        selectedGenre?.name || styleTags || 'Pop',
      duration,
      isInstrumental,
      includeVocals: !isInstrumental && includeVocals,
      voicePreset,
      styleTags,
      customTitle:  customTitle.trim(),
      bpmHint:      bpmHint.trim(),
      mode,
    });
  };

  const DURATION_STEPS = [30, 45, 60, 90, 120];

  return (
    <div className="create-panel glass-panel">
      {/* Mode Switcher Header */}
      <div className="panel-header">
        <div className="mode-tabs">
          <button
            type="button"
            className={`tab-btn ${mode === 'simple' ? 'active' : ''}`}
            onClick={() => setMode('simple')}
          >
            <span>✨ Simple Mode</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${mode === 'custom' ? 'active' : ''}`}
            onClick={() => setMode('custom')}
          >
            <span>🎛️ Studio Mode</span>
          </button>
        </div>

        <div className="toggles-group">
          <div className="toggle-row">
            <label className="switch">
              <input
                type="checkbox"
                checked={isInstrumental}
                onChange={(e) => {
                  setIsInstrumental(e.target.checked);
                  if (e.target.checked) setIncludeVocals(false);
                }}
              />
              <span className="slider round" />
            </label>
            <span className="toggle-label">🎹 Instrumental Only</span>
          </div>

          <div className="toggle-row">
            <label className="switch">
              <input
                type="checkbox"
                checked={includeVocals && !isInstrumental}
                disabled={isInstrumental}
                onChange={(e) => setIncludeVocals(e.target.checked)}
              />
              <span className="slider round" />
            </label>
            <span className="toggle-label" style={{ opacity: isInstrumental ? 0.4 : 1 }}>
              🎤 AI Vocals
            </span>
          </div>
        </div>
      </div>

      {/* Voice Preset Selector */}
      {includeVocals && !isInstrumental && (
        <div className="voice-selector">
          <span className="voice-label">🎙️ Voice Style</span>
          <div className="voice-options">
            {[
              { id: 'male_singer',   label: '🎤 Male' },
              { id: 'female_singer', label: '🎤 Female' },
              { id: 'melodic',       label: '🎵 Melodic' },
              { id: 'expressive',    label: '🎭 Expressive' },
            ].map((voice) => (
              <button
                key={voice.id}
                type="button"
                className={`voice-btn ${voicePreset === voice.id ? 'active' : ''}`}
                onClick={() => setVoicePreset(voice.id)}
              >
                {voice.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="panel-form">
        {/* Simple Mode */}
        {mode === 'simple' ? (
          <div className="form-group">
            <label className="input-label">Song Description / Vibe</label>
            <textarea
              className="prompt-textarea"
              placeholder="Describe the style, mood, or story — e.g. an epic 80s synthwave chase through a neon Tokyo night..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              required
            />
          </div>
        ) : (
          /* Custom Studio Mode */
          <div className="custom-mode-fields">
            <div className="form-group">
              <label className="input-label">Song Title (Optional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="Give your track a custom title..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="input-label">Style Tags / Genres</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. synthpop, heavy bass, upbeat"
                  value={styleTags}
                  onChange={(e) => setStyleTags(e.target.value)}
                />
              </div>
              <div className="form-group bpm-group">
                <label className="input-label">BPM Hint</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 120-130"
                  value={bpmHint}
                  onChange={(e) => setBpmHint(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Lyric Concept / Theme</label>
              <textarea
                className="prompt-textarea"
                placeholder="Describe the theme, mood, or storyline..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
        )}

        {/* Quick Style Presets */}
        <div className="form-group">
          <label className="input-label">Quick Style Presets</label>
          <div className="presets-grid">
            {GENRE_PRESETS.map((genreObj) => (
              <GenreTag
                key={genreObj.name}
                genre={genreObj}
                isSelected={selectedGenre?.name === genreObj.name}
                onClick={handleGenreClick}
              />
            ))}
          </div>
        </div>

        {/* Track Duration — step buttons */}
        <div className="form-group duration-group">
          <div className="duration-header">
            <label className="input-label">Track Duration</label>
            <span className="duration-value">{duration}s</span>
          </div>
          <div className="duration-steps">
            {DURATION_STEPS.map((step) => (
              <button
                key={step}
                type="button"
                className={`duration-step-btn ${duration === step ? 'active' : ''}`}
                onClick={() => setDuration(step)}
              >
                {step >= 60 ? `${step / 60}min` : `${step}s`}
              </button>
            ))}
          </div>
          <p className="duration-note">
            ⚡ Powered by Stable Audio 2.5 — up to 2 min studio-quality tracks
          </p>
        </div>

        {/* Generate Button */}
        <div className="form-footer">
          <button
            type="submit"
            className="glow-button submit-btn"
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? (
              <span>⚡ Generating...</span>
            ) : (
              <span>✨ Generate Track</span>
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .create-panel {
          border-radius: var(--radius-lg);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
          gap: 16px;
        }

        .mode-tabs {
          display: flex;
          gap: 4px;
          background: rgba(0, 0, 0, 0.35);
          padding: 4px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
        }

        .tab-btn {
          padding: 8px 18px;
          border-radius: var(--radius-full);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          color: #fff;
          background: var(--gradient-primary);
          box-shadow: 0 4px 14px var(--accent-purple-glow);
        }

        .toggles-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .toggle-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .toggle-label {
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .voice-selector {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          background: rgba(124, 58, 237, 0.08);
          border: 1px solid rgba(124, 58, 237, 0.25);
          flex-wrap: wrap;
        }

        .voice-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-purple);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .voice-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .voice-btn {
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 600;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.04);
          transition: all 0.2s ease;
        }

        .voice-btn:hover {
          color: var(--text-primary);
          border-color: var(--accent-purple);
          background: rgba(124, 58, 237, 0.15);
        }

        .voice-btn.active {
          color: #fff;
          border-color: var(--accent-purple);
          background: var(--gradient-primary);
          box-shadow: 0 2px 10px var(--accent-purple-glow);
        }

        /* Toggle switch */
        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 22px;
          flex-shrink: 0;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: rgba(255, 255, 255, 0.12);
          transition: .3s;
          border-radius: 22px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }
        input:checked + .slider { background: var(--accent-purple); }
        input:checked + .slider:before { transform: translateX(18px); }

        .panel-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .custom-mode-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
        }

        .bpm-group {
          min-width: 120px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .input-field {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 11px 14px;
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .input-field:focus { border-color: var(--accent-purple); }

        .prompt-textarea {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 13px 15px;
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          outline: none;
          line-height: 1.55;
          transition: border-color 0.2s ease;
        }

        .prompt-textarea:focus { border-color: var(--accent-purple); }

        .presets-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .duration-group { margin-top: 4px; }

        .duration-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .duration-value {
          font-size: 14px;
          font-weight: 800;
          color: var(--accent-cyan);
          font-family: var(--font-heading);
        }

        .duration-steps {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .duration-step-btn {
          flex: 1;
          min-width: 52px;
          padding: 8px 10px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.03);
          transition: all 0.2s ease;
          text-align: center;
        }

        .duration-step-btn:hover {
          border-color: var(--accent-purple);
          color: var(--text-primary);
          background: rgba(124, 58, 237, 0.12);
        }

        .duration-step-btn.active {
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.12);
          box-shadow: 0 0 12px rgba(6, 182, 212, 0.2);
        }

        .duration-note {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .form-footer { margin-top: 8px; }

        :global(.submit-btn) {
          width: 100%;
          justify-content: center;
          padding: 16px;
          font-size: 16px;
          font-family: var(--font-heading);
          letter-spacing: 0.3px;
        }

        .submit-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none !important;
        }

        @media (max-width: 480px) {
          .create-panel { padding: 20px 16px; }
          .panel-header { flex-direction: column; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
