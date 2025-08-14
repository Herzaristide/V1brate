'use client';

import { useMetronome } from '../../../contexts/MetronomeContext';
import { usePitchDetection } from '../../../utils/usePitchDetection';
import MusicalStaff from '../tuner/MusicalStaff';
import React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';

const TunerWidget = React.memo(() => {
  const { freq, clarity } = usePitchDetection();
  const { isPlaying: metronomeIsPlaying, currentBeat } = useMetronome();
  const [latestNotes, setLatestNotes] = useState<
    Array<{
      note: string;
      freq: number;
      clarity: number;
      isTick?: boolean;
      tickId?: number;
    }>
  >([]);

  const [noteCount, setNoteCount] = useState(200); // Reduced for widget
  const lastTickTimeRef = useRef<number>(0);
  const previousBeatRef = useRef<number>(0);

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

  // Color based on individual note accuracy
  const accuracyColor = useCallback(
    (frequency: number | null, noteClarity?: number) => {
      if (!frequency) return 'bg-gray-400';
      const clarityToUse = noteClarity !== undefined ? noteClarity : clarity;
      if (clarityToUse < 0.7) return 'bg-gray-400';
      if (clarityToUse > 0.95) return 'bg-green-400';
      if (clarityToUse > 0.85) return 'bg-yellow-400';
      return 'bg-red-400';
    },
    [clarity]
  );

  // Calculate horizontal position for notes - use fixed buffer size for consistent speed
  const getNoteLeft = useCallback(
    (index: number, total: number) => {
      // Always use noteCount for consistent positioning, regardless of current buffer size
      const effectiveTotal = Math.max(noteCount, 1);
      // Calculate the position based on the note's actual index in the full buffer
      const adjustedIndex = Math.max(0, noteCount - total + index);
      const percentage =
        effectiveTotal > 1
          ? (adjustedIndex / (effectiveTotal - 1)) * 80 + 10
          : 50;
      return `${percentage}%`;
    },
    [noteCount]
  );

  // Add new notes
  useEffect(() => {
    if (freq && clarity > 0.6) {
      const note = getNote(freq);
      if (note) {
        console.log('Adding note:', note, 'freq:', freq, 'clarity:', clarity);
        setLatestNotes((prev) => {
          const newNotes = [...prev, { note, freq, clarity }];
          return newNotes.slice(-noteCount);
        });
      }
    }
  }, [freq, clarity, noteCount, getNote]);

  // Watch for metronome beat changes and add tick markers
  useEffect(() => {
    if (metronomeIsPlaying && currentBeat > 0) {
      // Check if this is a new beat (different from previous)
      if (currentBeat !== previousBeatRef.current) {
        console.log('New beat detected:', currentBeat);
        previousBeatRef.current = currentBeat;

        const now = Date.now();
        // Prevent duplicate ticks within 50ms
        if (now - lastTickTimeRef.current >= 50) {
          lastTickTimeRef.current = now;

          console.log('Adding tick marker for beat:', currentBeat);
          setLatestNotes((prev) => {
            const newNotes = [
              ...prev,
              {
                note: '',
                freq: 0,
                clarity: 0,
                isTick: true,
                tickId: now
              }
            ];
            return newNotes.slice(-noteCount);
          });
        }
      }
    } else if (!metronomeIsPlaying) {
      // Reset when metronome stops
      previousBeatRef.current = 0;
    }
  }, [metronomeIsPlaying, currentBeat, noteCount]);

  // Current note display
  const currentNote = freq && clarity > 0.7 ? getNote(freq) : '';
  const currentFreq = freq && clarity > 0.7 ? freq.toFixed(1) : '';

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
      {/* Current Note Display */}
      <div className="flex-shrink-0 p-4 text-center">
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
        <div className="mt-2">
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-200 ${
                clarity > 0.9
                  ? 'bg-green-400'
                  : clarity > 0.7
                  ? 'bg-yellow-400'
                  : 'bg-red-400'
              }`}
              style={{ width: `${Math.min(100, clarity * 100)}%` }}
            />
          </div>
          <div className="text-xs text-white/60 mt-1">
            Clarity: {(clarity * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Musical Staff */}
      <div className="flex-1 min-h-0">
        <MusicalStaff
          notes={latestNotes}
          accuracyColor={accuracyColor}
          getNoteLeft={getNoteLeft}
        />
      </div>
    </div>
  );
});

TunerWidget.displayName = 'TunerWidget';

export default TunerWidget;
