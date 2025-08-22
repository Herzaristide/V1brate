interface MusicalStaffProps {
  notes: Array<{
    note: string;
    freq: number;
    clarity: number;
    timestamp?: number;
    isTick?: boolean;
    tickId?: number;
    isVisible?: boolean;
  }>;
  accuracyColor: (freq: number | null, clarity?: number) => string;
  getNoteLeft: (timestamp: number, currentTime: number) => number;
  currentTime?: number;
  timeWindow?: number;
}

// Note positions relative to treble staff center (B4 = 0)
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
  G3: 9,
  F3: 10,
  E3: 11,
  D3: 12,
  C3: 13,
};

// Add accidentals at same positions as natural notes
['C♯', 'D♯', 'F♯', 'G♯', 'A♯', 'D♭', 'E♭', 'G♭', 'A♭', 'B♭'].forEach((acc) => {
  for (let octave = 1; octave <= 7; octave++) {
    const natural = acc.charAt(0) + octave;
    if (NOTE_POSITIONS[natural] !== undefined) {
      NOTE_POSITIONS[acc + octave] = NOTE_POSITIONS[natural];
    }
  }
});

// Treble clef SVG
const TrebleClef = () => (
  <svg
    width='100'
    height='200'
    viewBox='0 0 95.116 153.12'
    className='text-white fill-current'
  >
    <path
      fill='currentColor'
      d='m51.688 5.25c-5.427-0.1409-11.774 12.818-11.563 24.375 0.049 3.52 1.16 10.659 2.781 19.625-10.223 10.581-22.094 21.44-22.094 35.688-0.163 13.057 7.817 29.692 26.75 29.532 2.906-0.02 5.521-0.38 7.844-1 1.731 9.49 2.882 16.98 2.875 20.44 0.061 13.64-17.86 14.99-18.719 7.15 3.777-0.13 6.782-3.13 6.782-6.84 0-3.79-3.138-6.88-7.032-6.88-2.141 0-4.049 0.94-5.343 2.41-0.03 0.03-0.065 0.06-0.094 0.09-0.292 0.31-0.538 0.68-0.781 1.1-0.798 1.35-1.316 3.29-1.344 6.06 0 11.42 28.875 18.77 28.875-3.75 0.045-3.03-1.258-10.72-3.156-20.41 20.603-7.45 15.427-38.04-3.531-38.184-1.47 0.015-2.887 0.186-4.25 0.532-1.08-5.197-2.122-10.241-3.032-14.876 7.199-7.071 13.485-16.224 13.344-33.093 0.022-12.114-4.014-21.828-8.312-21.969zm1.281 11.719c2.456-0.237 4.406 2.043 4.406 7.062 0.199 8.62-5.84 16.148-13.031 23.719-0.688-4.147-1.139-7.507-1.188-9.5 0.204-13.466 5.719-20.886 9.813-21.281zm-7.719 44.687c0.877 4.515 1.824 9.272 2.781 14.063-12.548 4.464-18.57 21.954-0.781 29.781-10.843-9.231-5.506-20.158 2.312-22.062 1.966 9.816 3.886 19.502 5.438 27.872-2.107 0.74-4.566 1.17-7.438 1.19-7.181 0-21.531-4.57-21.531-21.875 0-14.494 10.047-20.384 19.219-28.969zm6.094 21.469c0.313-0.019 0.652-0.011 0.968 0 13.063 0 17.99 20.745 4.688 27.375-1.655-8.32-3.662-17.86-5.656-27.375z'
    />
  </svg>
);

export default function MusicalStaff({
  notes,
  accuracyColor,
  getNoteLeft,
  currentTime = Date.now(),
  timeWindow = 10,
}: MusicalStaffProps) {
  console.log('🎼 MusicalStaff - Received notes:', notes.length, notes);
  console.log('🎼 MusicalStaff - Current time:', currentTime);
  console.log('🎼 MusicalStaff - Time window:', timeWindow);

  // Convert DoReMi notation back to ABC notation for position lookup
  const convertToABC = (note: string): string => {
    const doReMiToABC: { [key: string]: string } = {
      Do: 'C',
      'Do#': 'C#',
      Reb: 'Db',
      Re: 'D',
      'Re#': 'D#',
      Mib: 'Eb',
      Mi: 'E',
      Fa: 'F',
      'Fa#': 'F#',
      Solb: 'Gb',
      Sol: 'G',
      'Sol#': 'G#',
      Lab: 'Ab',
      La: 'A',
      'La#': 'A#',
      Tib: 'Bb',
      Ti: 'B',
    };

    // Extract note name and octave
    const match = note.match(/^([A-Za-z#♯b♭]+)(\d+)$/);
    if (!match) return note;

    const [, noteName, octave] = match;
    const abcNote = doReMiToABC[noteName] || noteName;
    return abcNote + octave;
  };

  const getNotePosition = (note: string) => {
    // Convert to ABC notation first for position lookup
    const abcNote = convertToABC(note);

    // Extract the base note and octave from the note string
    const match = abcNote.match(/^([A-G][#♯b♭]?)(\d+)$/);
    if (!match) return null;

    const [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr);

    // Normalize accidentals for position lookup
    const normalizedNote = noteName.replace(/[#b]/g, (m) =>
      m === 'b' ? '♭' : '♯'
    );

    const noteKey = normalizedNote + octave;
    return NOTE_POSITIONS[noteKey] ?? null;
  };

  const getAccidental = (note: string) => {
    if (note.includes('♯') || note.includes('#')) return '♯';
    if (note.includes('♭') || note.includes('b')) return '♭';
    return null;
  };

  const getDisplayNote = (note: string) => {
    // Extract the base note name without octave for display
    const match = note.match(/^([A-Za-z#♯b♭]+)(\d+)$/);
    if (!match) return note;

    const [, noteName] = match;
    return noteName;
  };

  return (
    <div className='relative w-full h-full backdrop-blur-sm bg-white/5 rounded-xl overflow-hidden border border-white/10 shadow-inner'>
      {/* Staff container */}
      <div className='relative w-full h-full pt-8 pb-4 px-4'>
        <div className='absolute left-0 right-0 top-1/2 -translate-y-1/2 h-64'>
          {/* Staff lines */}
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
                  transform: `translateY(${position * 10}px)`,
                }}
              />
            );
          })}

          {/* Treble clef */}
          <div className='absolute left-1 top-1/2 -translate-y-1/2 z-30'>
            <TrebleClef />
          </div>

          {/* Time grid lines (dynamic based on time window) */}
          {Array.from(
            { length: Math.min(5, Math.floor(timeWindow / 2)) },
            (_, i) => {
              const interval =
                timeWindow / Math.min(5, Math.floor(timeWindow / 2));
              const secondsAgo = (i + 1) * interval;
              const fakeTimestamp = currentTime - secondsAgo * 1000;
              const position = getNoteLeft(fakeTimestamp, currentTime);

              return (
                <div
                  key={`time-grid-${i}`}
                  className='absolute top-0 bottom-0 w-px z-5 bg-white/20'
                  style={{ left: `${position}%` }}
                  title={`${secondsAgo.toFixed(1)}s ago`}
                />
              );
            }
          )}

          {/* Current time indicator (recording head) */}
          <div
            className='absolute top-0 bottom-0 w-0.5 z-25 bg-red-500/80 shadow-lg'
            style={{
              left: '85%',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
            }}
            title='Current Time'
          >
            <div className='absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-lg' />
          </div>

          {/* Notes */}
          {notes.map((item, idx) => {
            console.log(`🎼 Processing note ${idx}:`, item);

            // Check visibility flag first, then fallback to clarity check for backward compatibility
            const shouldDisplay =
              item.isVisible !== undefined
                ? item.isVisible
                : item.clarity > 0.5;

            console.log(`🎼 Note ${idx} shouldDisplay:`, shouldDisplay);

            if (!shouldDisplay) {
              console.log(
                `❌ Note ${idx} not displayed (visibility: ${shouldDisplay})`
              );
              return null;
            }

            const position = getNotePosition(item.note);
            console.log(
              `🎼 Note ${idx} position:`,
              position,
              'for note:',
              item.note
            );

            if (position === null) {
              console.log(
                `❌ Note ${idx} position is null for note:`,
                item.note
              );
              return null;
            }

            const accidental = getAccidental(item.note);
            const displayNote = getDisplayNote(item.note);
            const colorClass = accuracyColor(item.freq, item.clarity);
            const leftPosition = getNoteLeft(item.timestamp || 0, currentTime);

            console.log(`✅ Rendering note ${idx}:`, {
              note: item.note,
              position,
              accidental,
              displayNote,
              colorClass,
              leftPosition: leftPosition + '%',
              timestamp: item.timestamp,
            });

            return (
              <div
                key={`note-${idx}-${item.timestamp || idx}`}
                className='absolute z-20'
                style={{
                  top: `calc(50% + ${position * 10}px)`,
                  left: `${leftPosition}%`,
                  transform: 'translateY(-50%)',
                }}
              >
                {accidental && (
                  <span className='absolute -left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/80'>
                    {accidental}
                  </span>
                )}
                <div
                  className={`w-6 h-4 rounded-full ${colorClass} transition-all duration-300 ease-out shadow-lg`}
                  style={{
                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                    opacity: shouldDisplay ? 1 : 0.3,
                    transform: `scale(${shouldDisplay ? 1 : 0.8})`,
                  }}
                  title={`${displayNote} (${item.freq.toFixed(1)} Hz, ${(
                    item.clarity * 100
                  ).toFixed(0)}% clarity)`}
                />
              </div>
            );
          })}

          {/* Metronome ticks */}
          {notes.map((item, idx) => {
            if (!item.isTick) return null;

            const leftPosition = getNoteLeft(item.timestamp || 0, currentTime);

            return (
              <div
                key={`metronome-${item.tickId || idx}`}
                className='absolute top-0 bottom-0 w-1 z-15'
                style={{
                  left: `${leftPosition}%`,
                  background:
                    'linear-gradient(to bottom, rgba(96, 165, 250, 0.9), rgba(59, 130, 246, 0.7))',
                  boxShadow: '0 0 3px rgba(96, 165, 250, 0.6)',
                }}
                title='Metronome Beat'
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
