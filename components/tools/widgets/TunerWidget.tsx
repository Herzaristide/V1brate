'use client';

import { useMetronome } from '../../../contexts/MetronomeContext';
import { usePitchDetection } from '../../../utils/usePitchDetection';
import React from 'react';
import { useCallback, useState, useEffect } from 'react';

const TunerWidget = React.memo(() => {
  const { freq, clarity } = usePitchDetection();
  const { isPlaying: metronomeIsPlaying } = useMetronome();

  // State for previous note
  const [lastNote, setLastNote] = useState<{
    note: string;
    freq: number;
    targetFreq: number;
    centsDiff: number;
  } | null>(null);

  // Get note from frequency
  const getNote = useCallback((frequency: number): string => {
    if (!frequency || frequency < 20) return '';
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

  // Current note display logic
  const isCurrentlyDetecting = freq && clarity > 0.9;
  const currentNote = isCurrentlyDetecting ? getNote(freq) : '';
  const currentFreq = isCurrentlyDetecting ? freq.toFixed(1) : '';
  const targetFreq = isCurrentlyDetecting ? getNoteFrequency(freq) : 0;
  const centsDiff = isCurrentlyDetecting
    ? getCentsDifference(freq, targetFreq)
    : 0;

  // Update last note when we have a good detection
  useEffect(() => {
    if (isCurrentlyDetecting && currentNote) {
      setLastNote({
        note: currentNote,
        freq: freq,
        targetFreq: targetFreq,
        centsDiff: centsDiff
      });
    }
  }, [isCurrentlyDetecting, currentNote, freq, targetFreq, centsDiff]);

  // Display note - current if available, otherwise last with low opacity
  const displayNote = currentNote || lastNote?.note || 'A4';
  const displayFreq =
    currentFreq || (lastNote?.freq ? lastNote.freq.toFixed(1) : '440.0');
  const displayTargetFreq = targetFreq || lastNote?.targetFreq || 440.0;
  const displayCentsDiff = centsDiff || lastNote?.centsDiff || 0;
  const isShowingPrevious = !isCurrentlyDetecting && lastNote;

  // Determine tuning status
  const getTuningStatus = (cents: number) => {
    const absCents = Math.abs(cents);
    if (absCents <= 5) return { status: 'perfect', color: 'text-green-400' };
    if (absCents <= 15) return { status: 'close', color: 'text-yellow-400' };
    return { status: 'off', color: 'text-red-400' };
  };

  const tuningStatus = getTuningStatus(displayCentsDiff);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent p-4">
      {/* Current Note Display */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div
            className={`text-4xl font-bold transition-opacity duration-300 ${
              isShowingPrevious ? 'text-white/40' : 'text-white'
            }`}
          >
            {displayNote}
          </div>

          {metronomeIsPlaying && (
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Metronome</span>
            </div>
          )}
        </div>

        {/* Frequency Display */}
        <div
          className={`text-lg transition-opacity duration-300 ${
            isShowingPrevious ? 'text-white/30' : 'text-white/70'
          } mb-3`}
        >
          {displayFreq ? `${displayFreq} Hz` : 'Listening...'}
        </div>

        {/* Target Frequency and Difference */}
        {displayTargetFreq > 0 && (
          <div
            className={`space-y-2 transition-opacity duration-300 ${
              isShowingPrevious ? 'opacity-40' : 'opacity-100'
            }`}
          >
            {/* Cents Difference Display */}
            <div className={`text-2xl font-mono ${tuningStatus.color}`}>
              {displayCentsDiff > 0 ? '+' : ''}
              {displayCentsDiff} ¢
            </div>

            {/* Visual Tuning Meter */}
            <div className="mt-4 w-full max-w-48">
              <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                {/* Center marker */}
                <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/50 transform -translate-x-0.5"></div>

                {/* Tuning indicator */}
                <div
                  className={`absolute top-0 h-full w-1 rounded transition-all duration-200 ${
                    isShowingPrevious
                      ? 'bg-white/30'
                      : tuningStatus.status === 'perfect'
                      ? 'bg-green-400'
                      : tuningStatus.status === 'close'
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                  }`}
                  style={{
                    left: `${Math.max(
                      0,
                      Math.min(100, 50 + (displayCentsDiff / 50) * 50)
                    )}%`,
                    transform: 'translateX(-50%)'
                  }}
                ></div>
              </div>
              <div
                className={`flex justify-between text-xs mt-1 transition-opacity duration-300 ${
                  isShowingPrevious ? 'text-white/20' : 'text-white/40'
                }`}
              >
                <span>-50¢</span>
                <span>0¢</span>
                <span>+50¢</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TunerWidget.displayName = 'TunerWidget';

export default TunerWidget;
