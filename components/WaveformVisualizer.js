'use client';
import { useEffect, useRef } from 'react';

export default function WaveformVisualizer({ isPlaying = false, audioRef = null, barCount = 40, height = 40 }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const h = canvas.height;
      const gap = 2;
      const barWidth = (width - barCount * gap) / barCount;

      phase += 0.08;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;

        if (isPlaying) {
          // Dynamic animated wave based on sine curves
          const val1 = Math.sin(i * 0.2 + phase);
          const val2 = Math.cos(i * 0.15 - phase * 0.7);
          const val3 = Math.sin(i * 0.35 + phase * 1.2);
          const norm = (val1 + val2 + val3 + 3) / 6; // range 0..1
          barHeight = Math.max(6, norm * (h - 8));
        } else {
          // Static subtle bars when paused
          const staticNorm = (Math.sin(i * 0.25) + 1) / 2;
          barHeight = Math.max(4, staticNorm * (h * 0.35));
        }

        const x = i * (barWidth + gap);
        const y = (h - barHeight) / 2;

        // Gradient color
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          gradient.addColorStop(0, '#ec4899');
          gradient.addColorStop(0.5, '#7c3aed');
          gradient.addColorStop(1, '#06b6d4');
        } else {
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, barCount, height]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={height}
      style={{ width: '100%', height: `${height}px`, display: 'block' }}
    />
  );
}
