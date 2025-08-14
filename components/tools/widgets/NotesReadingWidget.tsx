'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Note {
  id: string;
  note: string;
  position: number; // Staff position relative to B4 = 0 (same as MusicalStaff)
  x: number; // Horizontal position (0-7 for 8 notes)
}

// Note positions relative to treble staff center (B4 = 0) - same as MusicalStaff
const NOTE_POSITIONS: { [key: string]: number } = {
  C7: -15,
  B6: -14,
  A6: -13,
  G6: -12,
  F6: -11,
  E6: -10,
  D6: -9,
  C6: -8,
  B5: -7,
  A5: -6,
  G5: -5,
  F5: -4,
  E5: -3,
  D5: -2,
  C5: -1,
  B4: 0,
  A4: 1,
  G4: 2,
  F4: 3,
  E4: 4,
  D4: 5,
  C4: 6,
  B3: 7,
  A3: 8,
  G3: 9
};

// Treble clef SVG - same as MusicalStaff
const TrebleClef = () => (
  <svg
    width="100"
    height="200"
    viewBox="0 0 95.116 153.12"
    className="text-white fill-current"
  >
    <path
      fill="currentColor"
      d="m51.688 5.25c-5.427-0.1409-11.774 12.818-11.563 24.375 0.049 3.52 1.16 10.659 2.781 19.625-10.223 10.581-22.094 21.44-22.094 35.688-0.163 13.057 7.817 29.692 26.75 29.532 2.906-0.02 5.521-0.38 7.844-1 1.731 9.49 2.882 16.98 2.875 20.44 0.061 13.64-17.86 14.99-18.719 7.15 3.777-0.13 6.782-3.13 6.782-6.84 0-3.79-3.138-6.88-7.032-6.88-2.141 0-4.049 0.94-5.343 2.41-0.03 0.03-0.065 0.06-0.094 0.09-0.292 0.31-0.538 0.68-0.781 1.1-0.798 1.35-1.316 3.29-1.344 6.06 0 11.42 28.875 18.77 28.875-3.75 0.045-3.03-1.258-10.72-3.156-20.41 20.603-7.45 15.427-38.04-3.531-38.184-1.47 0.015-2.887 0.186-4.25 0.532-1.08-5.197-2.122-10.241-3.032-14.876 7.199-7.071 13.485-16.224 13.344-33.093 0.022-12.114-4.014-21.828-8.312-21.969zm1.281 11.719c2.456-0.237 4.406 2.043 4.406 7.062 0.199 8.62-5.84 16.148-13.031 23.719-0.688-4.147-1.139-7.507-1.188-9.5 0.204-13.466 5.719-20.886 9.813-21.281zm-7.719 44.687c0.877 4.515 1.824 9.272 2.781 14.063-12.548 4.464-18.57 21.954-0.781 29.781-10.843-9.231-5.506-20.158 2.312-22.062 1.966 9.816 3.886 19.502 5.438 27.872-2.107 0.74-4.566 1.17-7.438 1.19-7.181 0-21.531-4.57-21.531-21.875 0-14.494 10.047-20.384 19.219-28.969zm6.094 21.469c0.313-0.019 0.652-0.011 0.968 0 13.063 0 17.99 20.745 4.688 27.375-1.655-8.32-3.662-17.86-5.656-27.375z"
    />
  </svg>
);

const NotesReadingWidget = React.memo(() => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'wrong' | null;
    expectedNote: string;
    playedNote: string;
  }>({ type: null, expectedNote: '', playedNote: '' });

  // Static note names to prevent dependency changes
  const noteNames = Object.keys(NOTE_POSITIONS);

  // Generate a random note - stable function
  const generateRandomNote = useCallback(
    (xPosition: number): Note => {
      const randomNoteName =
        noteNames[Math.floor(Math.random() * noteNames.length)];

      return {
        id: `${randomNoteName}-${xPosition}-${Date.now()}`,
        note: randomNoteName,
        position: NOTE_POSITIONS[randomNoteName],
        x: xPosition
      };
    },
    [] // Empty dependency array to make it stable
  );

  // Initialize notes - only run once
  useEffect(() => {
    const initialNotes = Array.from({ length: 8 }, (_, i) =>
      generateRandomNote(i)
    );
    setNotes(initialNotes);
  }, []); // Empty dependency array to run only once

  // Calculate horizontal position for notes - same logic as MusicalStaff
  const getNoteLeft = useCallback((index: number, total: number) => {
    const effectiveTotal = Math.max(8, 1);
    const percentage =
      effectiveTotal > 1 ? (index / (effectiveTotal - 1)) * 80 + 10 : 50;
    return `${percentage}%`;
  }, []);

  // MIDI note to note name conversion
  const midiNoteToNoteName = useCallback((midiNote: number): string => {
    const noteNames = [
      'C',
      'C#',
      'D',
      'D#',
      'E',
      'F',
      'F#',
      'G',
      'G#',
      'A',
      'A#',
      'B'
    ];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12];
    return `${noteName}${octave}`;
  }, []);

  // Check if played note matches current note
  const checkNote = useCallback(
    (playedNote: string) => {
      if (notes.length === 0) return;

      const currentNote = notes[currentNoteIndex];
      const isCorrect = playedNote === currentNote.note;

      // Set feedback
      setFeedback({
        type: isCorrect ? 'correct' : 'wrong',
        expectedNote: currentNote.note,
        playedNote: playedNote
      });

      // Clear feedback after 2 seconds
      setTimeout(() => {
        setFeedback({ type: null, expectedNote: '', playedNote: '' });
      }, 2000);

      // Always advance to next note (regardless of correct/wrong)
      if (isCorrect) {
        setScore((prev) => prev + 1);
      }

      // Remove current note and shift others
      setNotes((prev) => {
        const newNotes = prev.slice(1).map((note, index) => ({
          ...note,
          x: index
        }));

        // Add new note at the end
        const newNote = generateRandomNote(7);
        return [...newNotes, newNote];
      });

      // Reset current note index since we removed the first note
      setCurrentNoteIndex(0);
    },
    [notes, currentNoteIndex, generateRandomNote]
  );

  // MIDI input handling
  useEffect(() => {
    const handleMIDIMessage = (event: any) => {
      const [command, note, velocity] = event.data;

      // Note On message (144 + channel)
      if (command >= 144 && command <= 159 && velocity > 0) {
        const noteName = midiNoteToNoteName(note);
        checkNote(noteName);
      }
    };

    const setupMIDI = async () => {
      if ('requestMIDIAccess' in navigator) {
        try {
          const midiAccess = await (navigator as any).requestMIDIAccess();

          midiAccess.inputs.forEach((input: any) => {
            input.onmidimessage = handleMIDIMessage;
          });
        } catch (error) {
          console.error('MIDI access failed:', error);
        }
      }
    };

    if (isPlaying) {
      setupMIDI();
    }
  }, [isPlaying, midiNoteToNoteName, checkNote]);

  // Reset game
  const resetGame = useCallback(() => {
    const newNotes = Array.from({ length: 8 }, (_, i) => generateRandomNote(i));
    setNotes(newNotes);
    setCurrentNoteIndex(0);
    setScore(0);
  }, [generateRandomNote]);

  return (
    <div className="relative w-full h-full backdrop-blur-sm bg-white/5 rounded-xl overflow-hidden border border-white/10 shadow-inner">
      {/* Header - same style as MusicalStaff */}
      <div className="absolute top-2 left-3 right-3 flex justify-between items-center text-xs text-white/70 select-none z-10">
        <span>Notes Reading Practice</span>
        <div className="flex items-center gap-4">
          <span className="text-green-400">Score: {score}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                isPlaying
                  ? 'bg-red-600/80 hover:bg-red-600 text-white'
                  : 'bg-green-600/80 hover:bg-green-600 text-white'
              }`}
            >
              {isPlaying ? 'Stop' : 'Start'}
            </button>
            <button
              onClick={resetGame}
              className="px-2 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded text-xs transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Staff container - same structure as MusicalStaff */}
      <div className="relative w-full h-full pt-12 pb-4 px-4">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-64">
          {/* Staff lines - same as MusicalStaff */}
          {Array.from({ length: 13 }, (_, i) => {
            const position = (i - 6) * 2; // -12 to 12, step 2
            const isMainLine = position >= -4 && position <= 4;
            return (
              <div
                key={position}
                className={`absolute left-0 right-0 border-t ${
                  isMainLine
                    ? 'border-white/80 border-t-2'
                    : 'border-white/50 border-t-1'
                }`}
                style={{
                  top: '50%',
                  transform: `translateY(${position * 10}px)`
                }}
              />
            );
          })}

          {/* Treble clef - same as MusicalStaff */}
          <div className="absolute left-1 top-1/2 -translate-y-1/2 z-30">
            <TrebleClef />
          </div>

          {/* Notes - same styling approach as MusicalStaff */}
          {notes.map((note, idx) => {
            const isCurrentNote = idx === currentNoteIndex;

            return (
              <div
                key={note.id}
                className="absolute z-20"
                style={{
                  top: `calc(50% + ${note.position * 10}px)`,
                  left: getNoteLeft(idx, notes.length),
                  transform: 'translateY(-50%)'
                }}
              >
                <div
                  className={`w-6 h-4 rounded-full ${
                    isCurrentNote
                      ? 'bg-green-400 border-2 border-green-300'
                      : 'bg-white border-2 border-gray-400'
                  }`}
                  style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }}
                  title={`${note.note} ${isCurrentNote ? '(Current)' : ''}`}
                />
                {isCurrentNote && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-green-400 font-medium">
                    ▲
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback Display */}
      {feedback.type && (
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 px-4 py-2 rounded-lg text-sm font-semibold ${
            feedback.type === 'correct'
              ? 'bg-green-600/90 text-white'
              : 'bg-red-600/90 text-white'
          } backdrop-blur-sm shadow-lg`}
        >
          {feedback.type === 'correct' ? (
            <span>✓ Correct!</span>
          ) : (
            <span>
              ✗ Wrong! Expected:{' '}
              <span className="font-bold">{feedback.expectedNote}</span>,
              Played: <span className="font-bold">{feedback.playedNote}</span>
            </span>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-2 left-3 right-3 text-xs text-white/60 select-none">
        {isPlaying ? (
          <span>
            Play the <span className="text-green-400">highlighted note</span> on
            your MIDI device
          </span>
        ) : (
          'Press Start to begin practicing note reading'
        )}
      </div>
    </div>
  );
});

NotesReadingWidget.displayName = 'NotesReadingWidget';

export default NotesReadingWidget;
