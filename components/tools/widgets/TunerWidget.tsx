'use client';

import { useMetronome } from '../../../contexts/MetronomeContext';
import { usePitchDetection } from '../../../utils/usePitchDetection';
import React from 'react';
import { useCallback } from 'react';

const TunerWidget = React.memo(() => {
  const { freq, clarity } = usePitchDetection();
  const { isPlaying: metronomeIsPlaying } = useMetronome();

  // Get note from frequency
  const getNote = useCallback((frequency: number): string => {
    if (!frequency || frequency < 20) return '';
    const A4 = 440;
    const semitoneRatio = Math.pow(2, 1 / 12);
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

    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
    const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;
    const noteIndex = ((semitonesFromA4 % 12) + 12) % 12;
    const adjustedNoteIndex = (noteIndex + 9) % 12;

    return noteNames[adjustedNoteIndex] + octave;
  }, []);

  // Current note display
  const currentNote = freq && clarity > 0.7 ? getNote(freq) : '';
  const currentFreq = freq && clarity > 0.7 ? freq.toFixed(1) : '';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent p-4">
      {/* Current Note Display */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-4xl font-bold text-white">
            {currentNote || '---'}
          </div>
          {metronomeIsPlaying && (
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Metronome</span>
            </div>
          )}
        </div>
        <div className="text-lg text-white/70">
          {currentFreq ? `${currentFreq} Hz` : 'Listening...'}
        </div>
        <div className="mt-4">
          <div className="w-full max-w-xs bg-white/20 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-200 ${
                clarity > 0.9
                  ? 'bg-green-400'
                  : clarity > 0.7
                  ? 'bg-yellow-400'
                  : 'bg-red-400'
              }`}
              style={{ width: `${Math.min(100, clarity * 100)}%` }}
            />
          </div>
          <div className="text-sm text-white/60 mt-2">
            Clarity: {(clarity * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
});

TunerWidget.displayName = 'TunerWidget';

export default TunerWidget;
