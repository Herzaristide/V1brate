'use client';

import { useMetronome } from '../../../contexts/MetronomeContext';
import { usePitchDetection } from '../../../utils/usePitchDetection';
import MusicalStaff from '../tuner/MusicalStaff';
import React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';

const MusicalStaffWidget = React.memo(() => {
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

  const [noteCount, setNoteCount] = useState(200); // Notes buffer size
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
        previousBeatRef.current = currentBeat;

        const now = Date.now();
        // Prevent duplicate ticks within 50ms
        if (now - lastTickTimeRef.current >= 50) {
          lastTickTimeRef.current = now;

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

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
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

MusicalStaffWidget.displayName = 'MusicalStaffWidget';

export default MusicalStaffWidget;
