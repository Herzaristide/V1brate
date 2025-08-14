'use client';

import React, { useMemo, useCallback } from 'react';

interface MusicalStaffProps {
  notes: Array<{
    note: string;
    freq: number;
    clarity: number;
    isTick?: boolean;
  }>;
  accuracyColor: (freq: number | null) => string;
  getNoteLeft: (idx: number, total: number) => string;
  noteRange?: 'violin' | 'piano' | 'guitar' | 'bass' | 'custom';
  customLowNote?: string;
  customHighNote?: string;
  onRangeChange?: (lowNote: string, highNote: string) => void;
}

// Traditional staff line notes for treble and bass clefs
const TREBLE_STAFF_LINES = ['F5', 'D5', 'B4', 'G4', 'E4']; // Top to bottom
const BASS_STAFF_LINES = ['A3', 'F3', 'D3', 'B2', 'G2']; // Top to bottom

// Complete note-to-staff position mapping - positions relative to treble staff center (B4)
// Each unit represents exactly one staff line/space position
const NOTE_POSITIONS: { [key: string]: number } = {
  // Treble clef positions (0 = middle line B4, negative = above, positive = below)
  // Lines: F5(-4), D5(-2), B4(0), G4(2), E4(4)
  // Spaces: E5(-3), C5(-1), A4(1), F4(3)
  C7: -15, // Very high above staff (ledger line)
  B6: -14, // High above staff (space)
  A6: -13, // High above staff (ledger line)
  G6: -12, // Above staff (space)
  F6: -11, // Above staff (ledger line)
  E6: -10, // Above staff (space)
  D6: -9, // Above staff (ledger line)
  C6: -8, // Above staff (second ledger line above) - corrected
  B5: -7, // Above staff (space above first ledger line)
  A5: -6, // Above staff (first ledger line above)
  G5: -5, // Above staff (space)
  F5: -4, // Top line
  E5: -3, // 4th space
  D5: -2, // 4th line
  C5: -1, // 3rd space
  B4: 0, // 3rd line (middle line)
  A4: 1, // 2nd space
  G4: 2, // 2nd line
  F4: 3, // 1st space
  E4: 4, // 1st line (bottom)
  D4: 5, // Below staff (space)
  C4: 6, // Below staff (ledger line)
  B3: 7, // Below staff (space)
  A3: 8, // Below staff (ledger line)
  G3: 9, // Below staff (space)
  F3: 10, // Below staff (ledger line)
  E3: 11, // Below staff (space)
  D3: 12, // Below staff (ledger line)
  C3: 13 // Below staff (space)
};

// Add sharp/flat positions (same as their natural note counterparts)
const addAccidentalPositions = () => {
  const accidentals = ['C♯', 'D♯', 'F♯', 'G♯', 'A♯'];
  const flats = ['D♭', 'E♭', 'G♭', 'A♭', 'B♭'];

  for (let octave = 1; octave <= 7; octave++) {
    accidentals.forEach((acc) => {
      const note = acc + octave;
      const natural = acc.charAt(0) + octave;
      const naturalPos = NOTE_POSITIONS[natural];

      // Position accidentals at the same height as their natural note
      if (naturalPos !== undefined) {
        NOTE_POSITIONS[note] = naturalPos;
      }
    });

    // Add flat equivalents
    flats.forEach((flat) => {
      const note = flat + octave;
      const sharpEquivalent = convertFlatToSharp(note);
      if (NOTE_POSITIONS[sharpEquivalent] !== undefined) {
        NOTE_POSITIONS[note] = NOTE_POSITIONS[sharpEquivalent];
      }
    });
  }
};

const getNextNaturalNote = (note: string): string => {
  const noteChar = note.charAt(0);
  const octave = parseInt(note.slice(1));
  const noteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const index = noteOrder.indexOf(noteChar);

  if (index === 6) return `C${octave + 1}`;
  return `${noteOrder[index + 1]}${octave}`;
};

const convertFlatToSharp = (flatNote: string): string => {
  const flatToSharp: { [key: string]: string } = {
    'D♭': 'C♯',
    'E♭': 'D♯',
    'G♭': 'F♯',
    'A♭': 'G♯',
    'B♭': 'A♯'
  };

  const noteBase = flatNote.replace(/\d+/g, '');
  const octave = flatNote.match(/\d+/)?.[0] || '';

  return flatToSharp[noteBase] ? flatToSharp[noteBase] + octave : flatNote;
};

// Initialize accidental positions
addAccidentalPositions();

// Treble clef SVG path
const TrebleClef = () => (
  <svg
    width="100"
    height="200"
    viewBox="0 0 95.116 153.12"
    className="text-white fill-current"
  >
    <path
      id="path26"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      d="m51.688 5.25c-5.427-0.1409-11.774 12.818-11.563 24.375 0.049 3.52 1.16 10.659 2.781 19.625-10.223 10.581-22.094 21.44-22.094 35.688-0.163 13.057 7.817 29.692 26.75 29.532 2.906-0.02 5.521-0.38 7.844-1 1.731 9.49 2.882 16.98 2.875 20.44 0.061 13.64-17.86 14.99-18.719 7.15 3.777-0.13 6.782-3.13 6.782-6.84 0-3.79-3.138-6.88-7.032-6.88-2.141 0-4.049 0.94-5.343 2.41-0.03 0.03-0.065 0.06-0.094 0.09-0.292 0.31-0.538 0.68-0.781 1.1-0.798 1.35-1.316 3.29-1.344 6.06 0 11.42 28.875 18.77 28.875-3.75 0.045-3.03-1.258-10.72-3.156-20.41 20.603-7.45 15.427-38.04-3.531-38.184-1.47 0.015-2.887 0.186-4.25 0.532-1.08-5.197-2.122-10.241-3.032-14.876 7.199-7.071 13.485-16.224 13.344-33.093 0.022-12.114-4.014-21.828-8.312-21.969zm1.281 11.719c2.456-0.237 4.406 2.043 4.406 7.062 0.199 8.62-5.84 16.148-13.031 23.719-0.688-4.147-1.139-7.507-1.188-9.5 0.204-13.466 5.719-20.886 9.813-21.281zm-7.719 44.687c0.877 4.515 1.824 9.272 2.781 14.063-12.548 4.464-18.57 21.954-0.781 29.781-10.843-9.231-5.506-20.158 2.312-22.062 1.966 9.816 3.886 19.502 5.438 27.872-2.107 0.74-4.566 1.17-7.438 1.19-7.181 0-21.531-4.57-21.531-21.875 0-14.494 10.047-20.384 19.219-28.969zm6.094 21.469c0.313-0.019 0.652-0.011 0.968 0 13.063 0 17.99 20.745 4.688 27.375-1.655-8.32-3.662-17.86-5.656-27.375z"
    />
  </svg>
);

export default function MusicalStaff({
  notes,
  accuracyColor,
  getNoteLeft,
  noteRange = 'violin',
  customLowNote = 'C3',
  customHighNote = 'C6',
  onRangeChange
}: MusicalStaffProps) {
  // Simplified configuration - always show only treble clef
  const staffConfig = useMemo(() => {
    const range =
      noteRange === 'custom'
        ? { low: customLowNote, high: customHighNote }
        : {
            violin: { low: 'G3', high: 'E7' },
            piano: { low: 'C3', high: 'C7' }, // Adjusted to treble range
            guitar: { low: 'E3', high: 'E6' },
            bass: { low: 'E3', high: 'G5' } // Adjusted to treble range
          }[noteRange];

    // Always show only treble clef
    return { showTreble: true, showBass: false, range };
  }, [noteRange, customLowNote, customHighNote]);

  // Get note position on treble staff
  const getNotePosition = useCallback((note: string) => {
    const normalizedNote = note.replace(/[♯♭#b]/g, (match) =>
      match === 'b' || match === '♭' ? '♭' : '♯'
    );

    const position = NOTE_POSITIONS[normalizedNote];
    if (position !== undefined) {
      return { staff: 'treble', position };
    }

    return null;
  }, []);

  const getAccidental = useCallback((note: string): string | null => {
    if (note.includes('♯') || note.includes('#')) return '♯';
    if (note.includes('♭') || note.includes('b')) return '♭';
    return null;
  }, []);

  return (
    <div className="relative w-full h-full backdrop-blur-sm bg-white/5 rounded-xl overflow-hidden border border-white/10 shadow-inner">
      {/* Header */}
      <div className="absolute top-2 left-3 right-3 flex justify-between items-center text-xs text-white/70 select-none z-10">
        <div className="flex items-center gap-2">
          <span>
            {staffConfig.range.low} - {staffConfig.range.high}
          </span>
          {noteRange === 'custom' && onRangeChange && (
            <div className="flex items-center gap-1">
              <select
                value={customLowNote}
                onChange={(e) => onRangeChange(e.target.value, customHighNote)}
                className="bg-white/10 backdrop-blur-md text-white rounded px-1 py-0.5 border border-white/20 text-xs"
                aria-label="Custom range low note"
              >
                {Object.keys(NOTE_POSITIONS)
                  .filter((note) => !note.includes('♯') && !note.includes('♭'))
                  .sort((a, b) => {
                    const aOctave = parseInt(a.slice(-1));
                    const bOctave = parseInt(b.slice(-1));
                    if (aOctave !== bOctave) return aOctave - bOctave;
                    return a.localeCompare(b);
                  })
                  .map((note) => (
                    <option key={note} value={note} className="bg-gray-800">
                      {note}
                    </option>
                  ))}
              </select>
              <span>to</span>
              <select
                value={customHighNote}
                onChange={(e) => onRangeChange(customLowNote, e.target.value)}
                className="bg-white/10 backdrop-blur-md text-white rounded px-1 py-0.5 border border-white/20 text-xs"
                aria-label="Custom range high note"
              >
                {Object.keys(NOTE_POSITIONS)
                  .filter((note) => !note.includes('♯') && !note.includes('♭'))
                  .sort((a, b) => {
                    const aOctave = parseInt(a.slice(-1));
                    const bOctave = parseInt(b.slice(-1));
                    if (aOctave !== bOctave) return aOctave - bOctave;
                    return a.localeCompare(b);
                  })
                  .map((note) => (
                    <option key={note} value={note} className="bg-gray-800">
                      {note}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
        <span className="text-white/50">Notes: {notes.length}</span>
      </div>

      {/* Staff container - Treble clef only */}
      <div className="relative w-full h-full pt-12 pb-4 px-4">
        {/* Treble Staff */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-32">
          {/* Display comprehensive staff lines - show full range regardless of notes */}
          {(() => {
            // Show a comprehensive range of staff lines and ledger lines
            // From C7 (-12) to C3 (13), covering the full range defined in NOTE_POSITIONS
            const minPosition = 12; // Bottom (C3)
            const maxPosition = -12; // Top (C7)

            // Generate all staff lines and ledger lines in the full range
            const allLines = [];
            for (
              let pos = Math.floor(maxPosition / 2) * 2;
              pos <= Math.ceil(minPosition / 2) * 2;
              pos += 2
            ) {
              allLines.push(pos);
            }

            return allLines.map((position) => {
              const yOffset = position * 10; // 10px spacing between lines
              const isMainStaffLine = position >= -4 && position <= 4;

              return (
                <div
                  key={`staff-line-${position}`}
                  className={`absolute left-0 right-0 border-t ${
                    isMainStaffLine
                      ? 'border-white/80 border-t-2'
                      : 'border-white/50 border-t-1'
                  }`}
                  style={{
                    top: '50%',
                    transform: `translateY(${yOffset}px)`
                  }}
                />
              );
            });
          })()}

          {/* Treble clef */}
          <div className="absolute left-1 top-1/2 -translate-y-1/2 z-30">
            <TrebleClef />
          </div>
        </div>

        {/* Notes */}
        {notes.map((item, idx) => {
          if (item.clarity <= 0.7) return null;

          const notePos = getNotePosition(item.note);
          if (!notePos) return null;

          const accidental = getAccidental(item.note);
          const colorClass = accuracyColor(item.freq);

          // Calculate note position relative to staff center (B4 = middle line)
          // Each position unit is 10px to match staff line spacing
          const noteOffsetY = notePos.position * 10;

          return (
            <div
              key={idx}
              className="absolute"
              style={{
                top: `calc(50% + ${noteOffsetY}px)`,
                left: getNoteLeft(idx, notes.length),
                transform: 'translateY(-50%)'
              }}
            >
              {/* Accidental */}
              {accidental && (
                <span className="absolute -left-4 top-1/2 transform -translate-y-1/2 text-sm font-bold text-white/80">
                  {accidental}
                </span>
              )}

              {/* Note head */}
              <div
                className={`w-6 h-4 rounded-full ${colorClass}`}
                style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }}
                title={`${item.note} (${item.freq.toFixed(1)} Hz, ${(
                  item.clarity * 100
                ).toFixed(0)}% clarity)`}
              >
                {/* Glow effect for high clarity notes */}
                {item.clarity > 0.9 && (
                  <div
                    className={`absolute inset-0 rounded-full ${colorClass} opacity-50 animate-pulse`}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Metronome tick lines */}
        {notes.map((item, idx) => {
          if (!item.isTick) return null;

          return (
            <div
              key={`metronome-${idx}`}
              className="absolute top-0 bottom-0 z-50"
              style={{
                left: getNoteLeft(idx, notes.length),
                zIndex: 10,
                width: '1px',
                background:
                  'linear-gradient(to bottom, rgba(96, 165, 250, 0.8), rgba(59, 130, 246, 0.6))',
                boxShadow: '0 0 2px rgba(96, 165, 250, 0.5)'
              }}
              title="Metronome Beat"
            />
          );
        })}
      </div>
    </div>
  );
}
