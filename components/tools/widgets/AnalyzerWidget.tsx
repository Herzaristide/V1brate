'use client';

import { usePitchDetection } from '../../../utils/usePitchDetection';
import { useEffect, useState, useRef } from 'react';

export default function AnalyzerWidget() {
  const { freq, clarity } = usePitchDetection();
  const [frequencyHistory, setFrequencyHistory] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update frequency history
  useEffect(() => {
    if (freq && clarity > 0.5) {
      setFrequencyHistory((prev) => {
        const newHistory = [...prev, freq];
        return newHistory.slice(-100); // Keep last 100 readings
      });
    }
  }, [freq, clarity]);

  // Draw frequency graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frequencyHistory.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Find min/max for scaling
    const minFreq = Math.min(...frequencyHistory);
    const maxFreq = Math.max(...frequencyHistory);
    const freqRange = maxFreq - minFreq || 1;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw frequency line
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.beginPath();

    frequencyHistory.forEach((frequency, index) => {
      const x = (index / (frequencyHistory.length - 1)) * width;
      const normalizedFreq = (frequency - minFreq) / freqRange;
      const y = height - normalizedFreq * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw frequency labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px monospace';
    ctx.fillText(`${maxFreq.toFixed(1)} Hz`, 5, 15);
    ctx.fillText(`${minFreq.toFixed(1)} Hz`, 5, height - 5);
  }, [frequencyHistory]);

  // Get note name from frequency
  const getNoteName = (frequency: number): string => {
    if (!frequency) return '';
    const A4 = 440;
    const noteNames = [
      'C',
      'C♯',
      'D',
      'D♯',
      'E',
      'F',
      'F♯',
      'G',
      'G♯',
      'A',
      'A♯',
      'B'
    ];

    const semitoneFromA4 = Math.round(12 * Math.log2(frequency / A4));
    const octave = Math.floor((semitoneFromA4 + 9) / 12) + 4;
    const noteIndex = ((semitoneFromA4 % 12) + 12) % 12;
    const adjustedNoteIndex = (noteIndex + 9) % 12;

    return noteNames[adjustedNoteIndex] + octave;
  };

  const currentNote = freq && clarity > 0.7 ? getNoteName(freq) : '';
  const avgFreq =
    frequencyHistory.length > 0
      ? frequencyHistory.reduce((a, b) => a + b, 0) / frequencyHistory.length
      : 0;

  return (
    <div className="w-full h-full flex flex-col p-4 text-white">
      {/* Current Reading */}
      <div className="flex-shrink-0 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-white/70">Current Note</div>
            <div className="text-xl font-bold">{currentNote || '---'}</div>
          </div>
          <div>
            <div className="text-white/70">Frequency</div>
            <div className="text-xl font-bold">
              {freq ? freq.toFixed(1) : '---'} Hz
            </div>
          </div>
          <div>
            <div className="text-white/70">Clarity</div>
            <div className="text-xl font-bold">
              {(clarity * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-white/70">Average</div>
            <div className="text-xl font-bold">
              {avgFreq ? avgFreq.toFixed(1) : '---'} Hz
            </div>
          </div>
        </div>
      </div>

      {/* Frequency Graph */}
      <div className="flex-1 min-h-0">
        <div className="text-sm text-white/70 mb-2">Frequency Over Time</div>
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="w-full h-full bg-black/20 rounded border border-white/20"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Clear Button */}
      <button
        onClick={() => setFrequencyHistory([])}
        className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
      >
        Clear History
      </button>
    </div>
  );
}
