import {
  PitchPoint,
  NotationSystem,
  MusicalKey,
  NOTE_NAMES_ABC,
  NOTE_NAMES_DOREMI_MAP,
} from '../types';

// Frequency to note conversion
// Convert frequency to note with configurable standard pitch
export function frequencyToNote(
  frequency: number,
  standardPitch: number = 440
): {
  note: string;
  octave: number;
  cents: number;
} {
  const A4 = standardPitch;
  const semitoneRatio = Math.pow(2, 1 / 12);

  // Calculate the number of semitones from A4
  const semitonesFromA4 = Math.log(frequency / A4) / Math.log(semitoneRatio);

  // Calculate octave (A4 is in octave 4)
  const octave = Math.floor(semitonesFromA4 / 12) + 4;

  // Calculate note index (0 = C, 1 = C#, etc.)
  let noteIndex = Math.round(semitonesFromA4) % 12;
  if (noteIndex < 0) noteIndex += 12;

  // Adjust note index to start from C instead of A
  noteIndex = (noteIndex + 9) % 12;

  const note = NOTE_NAMES_ABC[noteIndex];

  // Calculate cents deviation
  const exactSemitones = semitonesFromA4;
  const roundedSemitones = Math.round(exactSemitones);
  const cents = Math.round((exactSemitones - roundedSemitones) * 100);

  return { note, octave, cents };
}

// Convert note to frequency with configurable standard pitch
export function noteToFrequency(
  note: string,
  octave: number,
  standardPitch: number = 440
): number {
  const noteIndex = NOTE_NAMES_ABC.indexOf(note);
  if (noteIndex === -1) return 0;

  // A4 = standardPitch Hz is our reference
  const A4 = standardPitch;
  const semitoneRatio = Math.pow(2, 1 / 12);

  // Calculate semitones from A4
  const semitonesFromA4 = (octave - 4) * 12 + (noteIndex - 9);

  return A4 * Math.pow(semitoneRatio, semitonesFromA4);
}

// Get note name in the specified notation system
export function getNoteDisplayName(
  note: string,
  notationSystem: NotationSystem
): string {
  if (notationSystem === 'ABC') {
    return note;
  } else {
    // Use the comprehensive DoReMi mapping that includes both sharps and flats
    return NOTE_NAMES_DOREMI_MAP[note] || note;
  }
}

// Convert note to preferred accidental system
export function convertAccidental(
  note: string,
  accidentalSystem: 'sharp' | 'flat'
): string {
  if (accidentalSystem === 'sharp') {
    // Convert flats to sharps where appropriate
    const flatToSharp: { [key: string]: string } = {
      Db: 'C#',
      Eb: 'D#',
      Gb: 'F#',
      Ab: 'G#',
      Bb: 'A#',
    };
    return flatToSharp[note] || note;
  } else {
    // Convert sharps to flats where appropriate
    const sharpToFlat: { [key: string]: string } = {
      'C#': 'Db',
      'D#': 'Eb',
      'F#': 'Gb',
      'G#': 'Ab',
      'A#': 'Bb',
    };
    return sharpToFlat[note] || note;
  }
}

// Transpose note to a different key
export function transposeNote(
  note: string,
  fromKey: MusicalKey,
  toKey: MusicalKey
): string {
  const fromIndex = NOTE_NAMES_ABC.indexOf(fromKey);
  const toIndex = NOTE_NAMES_ABC.indexOf(toKey);
  const noteIndex = NOTE_NAMES_ABC.indexOf(note);

  if (fromIndex === -1 || toIndex === -1 || noteIndex === -1) return note;

  const transposition = toIndex - fromIndex;
  let newNoteIndex = (noteIndex + transposition) % 12;
  if (newNoteIndex < 0) newNoteIndex += 12;

  return NOTE_NAMES_ABC[newNoteIndex];
}

// Get staff position for a note (for visual display)
export function getStaffPosition(note: string, octave: number): number {
  const noteIndex = NOTE_NAMES_ABC.indexOf(note);
  if (noteIndex === -1) return 0;

  // Middle C (C4) is at position 0
  const C4Position = 0;
  const notePositions = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6]; // C, C#, D, D#, E, F, F#, G, G#, A, A#, B

  const octaveOffset = (octave - 4) * 7; // 7 positions per octave
  return C4Position + octaveOffset + notePositions[noteIndex];
}

// Create pitch point from microphone input with configurable standard pitch
export function createPitchPoint(
  frequency: number,
  standardPitch: number = 440,
  timestamp: number = Date.now()
): PitchPoint {
  const { note, octave, cents } = frequencyToNote(frequency, standardPitch);
  const confidence = 1.0 - Math.abs(cents) / 50; // Convert cents to confidence score

  return {
    timestamp,
    frequency,
    note,
    octave,
    cents,
    confidence: Math.max(0, Math.min(1, confidence)), // Clamp between 0 and 1
  };
}

// Filter and smooth pitch data
export function smoothPitchData(
  pitchPoints: PitchPoint[],
  windowSize: number = 3
): PitchPoint[] {
  if (pitchPoints.length <= windowSize) return pitchPoints;

  const smoothed: PitchPoint[] = [];

  for (let i = 0; i < pitchPoints.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(pitchPoints.length, start + windowSize);
    const window = pitchPoints.slice(start, end);

    // Average the frequencies
    const avgFrequency =
      window.reduce((sum, point) => sum + point.frequency, 0) / window.length;

    // Recalculate note data from averaged frequency
    const smoothedPoint = createPitchPoint(
      avgFrequency,
      pitchPoints[i].timestamp
    );
    smoothed.push(smoothedPoint);
  }

  return smoothed;
}

// Convert cents to color for visualization
export function centsToColor(cents: number): string {
  const absCents = Math.abs(cents);

  if (absCents <= 5) return '#10b981'; // green (perfect)
  if (absCents <= 15) return '#f59e0b'; // yellow (good)
  if (absCents <= 25) return '#f97316'; // orange (fair)
  return '#ef4444'; // red (poor)
}

// Audio utility functions
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
