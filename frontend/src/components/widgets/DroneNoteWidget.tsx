'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';

// MIDI type declarations
interface MIDIInput extends EventTarget {
  id: string;
  name: string;
  onmidimessage: ((event: MIDIMessageEvent) => void) | null;
}

interface MIDIAccess extends EventTarget {
  inputs: Map<string, MIDIInput>;
  onstatechange: ((event: Event) => void) | null;
}

interface MIDIMessageEvent extends Event {
  data: Uint8Array;
}

declare global {
  interface Navigator {
    requestMIDIAccess(): Promise<MIDIAccess>;
  }
}

interface DroneNoteWidgetProps {
  settings?: Record<string, any>;
  updateSetting?: (key: string, value: any) => void;
}

const DroneNoteWidget: React.FC<DroneNoteWidgetProps> = ({
  settings = {},
  updateSetting,
}) => {
  const { standartPitch, notationSystem, accidentalSystem } =
    useUserPreferences();
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Calculate drone note frequencies based on standard pitch
  const getDroneNotes = useCallback(() => {
    const A4 = standartPitch;
    const semitoneRatio = Math.pow(2, 1 / 12);

    // Calculate frequencies relative to A4
    const frequencies: { [key: string]: number | string } = {};

    // All 12 semitone offsets from A (A4 = 0), starting from C
    const noteOffsets: Record<string, number> = {
      C: -9,
      'C#': -8,
      D: -7,
      'D#': -6,
      E: -5,
      F: -4,
      'F#': -3,
      G: -2,
      'G#': -1,
      A: 0,
      'A#': 1,
      B: 2,
    };

    // Generate for octaves 2 through 5 (added B5 support)
    [2, 3, 4, 5].forEach((octave) => {
      Object.entries(noteOffsets).forEach(([note, offset]) => {
        const octaveOffset = (octave - 4) * 12; // 12 semitones per octave
        const totalOffset = offset + octaveOffset;
        const frequency = A4 * Math.pow(semitoneRatio, totalOffset);

        // Determine label according to notation and accidental preferences
        const key = `${note}${octave}`;
        let label = '';

        if (notationSystem === 'DoReMi') {
          if (accidentalSystem === 'flat') {
            const flatMap: Record<string, string> = {
              C: 'Do',
              'C#': 'Ré♭',
              D: 'Ré',
              'D#': 'Mi♭',
              E: 'Mi',
              F: 'Fa',
              'F#': 'Sol♭',
              G: 'Sol',
              'G#': 'La♭',
              A: 'La',
              'A#': 'Si♭',
              B: 'Si',
            };
            label = `${flatMap[note] || note}${octave}`;
          } else {
            const noteMap: Record<string, string> = {
              C: 'Do',
              'C#': 'Do#',
              D: 'Ré',
              'D#': 'Ré#',
              E: 'Mi',
              F: 'Fa',
              'F#': 'Fa#',
              G: 'Sol',
              'G#': 'Sol#',
              A: 'La',
              'A#': 'La#',
              B: 'Si',
            };
            label = `${noteMap[note] || note}${octave}`;
          }
        } else {
          // ABC notation display
          if (accidentalSystem === 'flat') {
            const enharmonic: Record<string, string> = {
              'C#': 'D♭',
              'D#': 'E♭',
              'F#': 'G♭',
              'G#': 'A♭',
              'A#': 'B♭',
            };
            label = `${enharmonic[note] || note}${octave}`;
          } else {
            label = `${note}${octave}`;
          }
        }

        frequencies[key] = Math.round(frequency * 100) / 100;
        // also store a user-friendly mapping for labels
        frequencies[`${key}_label`] = label as any;
      });
    });

    return frequencies;
  }, [standartPitch, notationSystem, accidentalSystem]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const midiAccessRef = useRef<MIDIAccess | null>(null);

  // Mouse and play mode state
  const isMouseDownRef = useRef(false);
  const [isContinuous, setIsContinuous] = useState(
    settings.isContinuous ?? false
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedNote, setSelectedNote] = useState(settings.droneNote || 'A4');
  const [volume, setVolume] = useState(settings.droneVolume || 30);
  const [waveform, setWaveform] = useState<OscillatorType>(
    settings.droneWaveform || 'sine'
  );

  const [showSidebar, setShowSidebar] = useState(false);

  // Update settings when they change
  useEffect(() => {
    if (updateSetting) {
      updateSetting('droneNote', selectedNote);
      updateSetting('droneVolume', volume);
      updateSetting('droneWaveform', waveform);
      updateSetting('showSidebar', showSidebar);
      updateSetting('isContinuous', isContinuous);
    }
  }, [
    selectedNote,
    volume,
    waveform,
    showSidebar,
    isContinuous,
    updateSetting,
  ]);

  // Initialize audio context with better error handling
  const initAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        // Create AudioContext with user gesture requirement
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      return audioContextRef.current.state === 'running';
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return false;
    }
  }, []);

  // Stop playing drone note
  const stopDrone = useCallback(() => {
    if (
      oscillatorRef.current &&
      gainNodeRef.current &&
      audioContextRef.current
    ) {
      // Smooth fade-out
      gainNodeRef.current.gain.linearRampToValueAtTime(
        0,
        audioContextRef.current.currentTime + 0.1
      );

      setTimeout(() => {
        if (oscillatorRef.current) {
          oscillatorRef.current.stop();
          oscillatorRef.current = null;
        }
        gainNodeRef.current = null;
      }, 150);
    }
    setIsPlaying(false);
  }, []);

  // Play a specific note (used for mouse interactions and MIDI)
  const playNote = useCallback(
    async (noteKey: string) => {
      try {
        const success = await initAudioContext();
        if (!success || !audioContextRef.current) {
          console.warn('Audio context not available');
          return;
        }

        // Stop any existing oscillator
        stopDrone();

        const droneNotes = getDroneNotes();

        // Create new oscillator and gain node
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        oscillatorRef.current = oscillator;
        gainNodeRef.current = gainNode;

        // Configure oscillator
        oscillator.type = waveform;
        const freq =
          (droneNotes[noteKey as keyof typeof droneNotes] as number) || 0;
        oscillator.frequency.setValueAtTime(
          freq,
          audioContextRef.current.currentTime
        );

        // Configure gain with smooth fade-in
        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          volume / 100,
          audioContextRef.current.currentTime + 0.05
        );

        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        // Start oscillator
        oscillator.start();
        setIsPlaying(true);
        setSelectedNote(noteKey);
      } catch (error) {
        console.error('Error playing note:', error);
      }
    },
    [getDroneNotes, initAudioContext, stopDrone, waveform, volume]
  );

  // Toggle play/stop (kept for compatibility; uses playNote)
  const toggleDrone = useCallback(() => {
    if (isPlaying) {
      stopDrone();
    } else {
      playNote(selectedNote);
    }
  }, [isPlaying, playNote, selectedNote, stopDrone]);

  // Update volume in real-time
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        volume / 100,
        audioContextRef.current.currentTime
      );
    }
  }, [volume]);

  // Update frequency when note changes
  useEffect(() => {
    if (oscillatorRef.current && audioContextRef.current && isPlaying) {
      const droneNotes = getDroneNotes();
      oscillatorRef.current.frequency.setValueAtTime(
        (droneNotes[selectedNote as keyof typeof droneNotes] as number) || 0,
        audioContextRef.current.currentTime
      );
    }
  }, [selectedNote, isPlaying, getDroneNotes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDrone();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopDrone]);

  // Stop playing when mouse is released anywhere (unless continuous mode active)
  useEffect(() => {
    const onUp = () => {
      isMouseDownRef.current = false;
      if (!isContinuous) stopDrone();
    };

    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);

    return () => {
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
    };
  }, [isContinuous, stopDrone]);

  // MIDI initialization and setup
  useEffect(() => {
    const initMidi = async () => {
      try {
        if (navigator.requestMIDIAccess) {
          const midiAccess = await navigator.requestMIDIAccess();
          midiAccessRef.current = midiAccess;
        }
      } catch (error) {
        console.warn('MIDI not available:', error);
      }
    };

    initMidi();

    return () => {
      if (midiAccessRef.current) {
        midiAccessRef.current.onstatechange = null;
      }
    };
  }, []);

  // Convert MIDI note number to our note key format
  const midiNoteToKey = useCallback(
    (midiNote: number): string | null => {
      // MIDI note 60 = C4, 69 = A4
      const octave = Math.floor(midiNote / 12) - 1;
      const noteIndex = midiNote % 12;

      const notes = [
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
        'B',
      ];
      const note = notes[noteIndex];

      // Check if the generated note exists in our available notes
      const key = `${note}${octave}`;
      const droneNotes = getDroneNotes();

      return droneNotes[key] ? key : null;
    },
    [getDroneNotes]
  );

  // Setup MIDI input listener using global settings.selectedMidiInput
  useEffect(() => {
    const selectedMidi = (settings && settings.selectedMidiInput) || '';
    if (!selectedMidi || !midiAccessRef.current) return;

    const input = midiAccessRef.current.inputs.get(selectedMidi as any);
    if (!input) return;

    const handleMidiMessage = (event: MIDIMessageEvent) => {
      const status = event.data[0];
      const note = event.data[1];
      const velocity = event.data[2];

      // Note on message (144-159) and note off (128-143)
      if (
        (status >= 144 && status <= 159) ||
        (status >= 128 && status <= 143)
      ) {
        const isNoteOn = status >= 144 && velocity > 0;

        if (isNoteOn) {
          const noteKey = midiNoteToKey(note);
          if (noteKey) playNote(noteKey);
        } else {
          if (!isContinuous) stopDrone();
        }
      }
    };

    input.onmidimessage = handleMidiMessage;

    return () => {
      if (input.onmidimessage) input.onmidimessage = null;
    };
  }, [
    settings,
    playNote,
    stopDrone,
    isContinuous,
    midiAccessRef,
    midiNoteToKey,
  ]);

  return (
    <div className='flex h-full bg-gray-900 rounded-lg overflow-hidden relative'>
      {/* Main Pad Area */}
      <div className='flex-1 p-4'>
        {/* Header with controls toggle */}
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-white font-medium'>Virtual Piano</h3>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className='px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs'
          >
            {showSidebar ? 'Controls' : 'Controls'}
          </button>
        </div>

        {/* Piano Key Grid */}
        <div className='grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-0.5  h-[calc(100%-80px)] p-2'>
          {Object.keys(getDroneNotes())
            .filter((k) => !k.endsWith('_label'))
            .map((note) => {
              const isActive = selectedNote === note && isPlaying;
              const label = getDroneNotes()[`${note}_label`] || note;

              return (
                <button
                  key={note}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    isMouseDownRef.current = true;
                    playNote(note);
                  }}
                  onMouseEnter={() => {
                    if (isMouseDownRef.current) {
                      playNote(note);
                    }
                  }}
                  onDoubleClick={() => {
                    const next = !isContinuous;
                    setIsContinuous(next);
                    if (next) {
                      playNote(note);
                    } else {
                      stopDrone();
                    }
                  }}
                  onMouseUp={() => {
                    isMouseDownRef.current = false;
                    if (!isContinuous) stopDrone();
                  }}
                  className={`
                    rounded border transition-all duration-100
                    flex flex-col items-center justify-end
                    text-xs font-medium select-none cursor-pointer
                    transform-gpu
                    ${
                      isActive
                        ? 'bg-gray-300 border-gray-400 text-gray-900 shadow-inner scale-95'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 shadow-md hover:shadow-lg'
                    }
                    ${
                      isContinuous && selectedNote === note
                        ? 'ring-2 ring-yellow-400 ring-opacity-75'
                        : ''
                    }
                    active:scale-95
                  `}
                  style={{
                    transform: isActive
                      ? 'translateY(1px) scale(0.98)'
                      : 'translateY(0) scale(1)',
                  }}
                >
                  <span className={`text-center leading-tight pb-2 `}>
                    {label}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Sidebar Controls */}
      {showSidebar && (
        <div className='w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto'>
          <h4 className='text-white font-medium mb-4'>Controls</h4>

          {/* MIDI selection moved to global sidebar */}

          {/* Volume Control */}
          <div className='mb-6'>
            <label className='text-white text-sm font-medium mb-2 block'>
              Volume: {volume}%
            </label>
            <input
              type='range'
              min='0'
              max='100'
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
            />
          </div>

          {/* Waveform Selection */}
          <div className='mb-6'>
            <label className='text-white text-sm font-medium mb-2 block'>
              Waveform
            </label>
            <div className='grid grid-cols-2 gap-2'>
              {(
                ['sine', 'square', 'sawtooth', 'triangle'] as OscillatorType[]
              ).map((wave) => (
                <button
                  key={wave}
                  onClick={() => setWaveform(wave)}
                  className={`p-2 rounded text-sm font-medium transition-colors capitalize ${
                    waveform === wave
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {wave}
                </button>
              ))}
            </div>
          </div>

          {/* Continuous Mode */}
          <div className='mb-6'>
            <label className='flex items-center text-white text-sm'>
              <input
                type='checkbox'
                checked={isContinuous}
                onChange={(e) => {
                  setIsContinuous(e.target.checked);
                  if (!e.target.checked) {
                    stopDrone();
                  }
                }}
                className='mr-2'
              />
              Continuous Play Mode
            </label>
            <p className='text-xs text-gray-400 mt-1'>
              When enabled, double-click a pad to toggle continuous play
            </p>
          </div>

          {/* Instructions */}
          <div className='text-xs text-gray-400 space-y-1'>
            <p>
              <strong>Click:</strong> Play note (like piano key)
            </p>
            <p>
              <strong>Click & Drag:</strong> Glide between notes
            </p>
            <p>
              <strong>Double-click:</strong> Lock note (continuous play)
            </p>
            <p>
              <strong>MIDI Keyboard:</strong> Play from connected device
            </p>
            <p className='text-gray-500 italic mt-2'>
              White keys = natural notes, Dark keys = sharps/flats
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DroneNoteWidget;
