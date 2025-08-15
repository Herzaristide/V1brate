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
      isVisible?: boolean; // Flag to control display
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

  // Get exact frequency for a note
  const getNoteFrequency = useCallback((frequency: number): number => {
    if (!frequency || frequency < 20) return 0;
    const A4 = 442;
    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
    return A4 * Math.pow(2, semitonesFromA4 / 12);
  }, []);

  // Calculate difference in cents
  const getCentsDifference = useCallback(
    (detectedFreq: number, targetFreq: number): number => {
      if (!detectedFreq || !targetFreq) return 0;
      return Math.round(1200 * Math.log2(detectedFreq / targetFreq));
    },
    []
  );

  // Color based on cents difference from target note
  const accuracyColor = useCallback(
    (frequency: number | null, noteClarity?: number) => {
      if (!frequency) return 'bg-gray-400';
      const clarityToUse = noteClarity !== undefined ? noteClarity : clarity;

      // Still require minimum clarity for any color
      if (clarityToUse < 0.6) return 'bg-gray-400';

      // Calculate cents difference from target note
      const targetFreq = getNoteFrequency(frequency);
      const centsDiff = getCentsDifference(frequency, targetFreq);
      const absCents = Math.abs(centsDiff);

      // Color based on cents accuracy
      if (absCents <= 5) return 'bg-green-400'; // Perfect (±5 cents)
      if (absCents <= 15) return 'bg-yellow-400'; // Close (±15 cents)
      if (absCents <= 30) return 'bg-orange-400'; // Acceptable (±30 cents)
      return 'bg-red-400'; // Off (>30 cents)
    },
    [clarity, getNoteFrequency, getCentsDifference]
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

  // Add new notes - always add but mark visibility based on clarity
  useEffect(() => {
    if (freq) {
      // Lower threshold to capture more attempts
      const note = getNote(freq);
      if (note) {
        setLatestNotes((prev) => {
          const newNotes = [
            ...prev,
            {
              note,
              freq,
              clarity,
              // Add a flag to indicate if this note should be displayed
              isVisible: clarity > 0.6 // Only display notes with decent clarity
            }
          ];
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
                tickId: now,
                isVisible: true // Metronome ticks are always visible
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
