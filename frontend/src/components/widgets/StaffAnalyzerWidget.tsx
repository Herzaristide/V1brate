import { useMetronome } from '../../contexts/MetronomeContext';
import { usePitchDetection } from '../../hooks/usePitchDetection';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import MusicalStaff from '../ui/MusicalStaff';
import {
  frequencyToNote,
  getNoteDisplayName,
  convertAccidental,
} from '../../utils/musicUtils';
import { NOTE_NAMES_ABC } from '../../types';
import React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';

interface StaffAnalyzerWidgetProps {
  selectedMicrophone?: string;
  settings?: Record<string, any>;
  updateSetting?: (key: string, value: any) => void;
}

interface NoteHistoryItem {
  note: string;
  freq: number;
  clarity: number;
  timestamp: number;
  isTick?: boolean;
  tickId?: number;
  isVisible?: boolean;
}

const StaffAnalyzerWidget: React.FC<StaffAnalyzerWidgetProps> = ({
  settings,
  updateSetting,
}) => {
  const { frequency, clarity, isActive, start, stop } = usePitchDetection();
  const { isPlaying: metronomeIsPlaying, currentBeat } = useMetronome();
  const { standartPitch, notationSystem, accidentalSystem } =
    useUserPreferences();

  console.log('🎤 StaffAnalyzer - Pitch detection status:', {
    frequency,
    clarity,
    isActive,
    standartPitch,
    notationSystem,
    accidentalSystem,
  });

  // Get buffer size from settings or use default
  const bufferSize = settings?.bufferSize || 100;
  const minClarity = settings?.minClarity || 0.1; // Lowered for easier detection
  const showSettings = settings?.showSettings || false;
  const scrollSpeed = settings?.scrollSpeed || 50; // pixels per second
  const timeWindow = settings?.timeWindow || 10; // seconds of history to show
  const testMode = settings?.testMode || false; // Test mode for generating sample notes

  const [latestNotes, setLatestNotes] = useState<NoteHistoryItem[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const lastTickTimeRef = useRef<number>(0);
  const previousBeatRef = useRef<number>(0);
  const lastNoteTimeRef = useRef<number>(0);
  const animationRef = useRef<number>();

  // Convert frequency to note using global standard pitch and notation preferences
  const getNote = useCallback(
    (frequency: number): string => {
      console.log('🔄 getNote called with:', { frequency, standartPitch });

      if (!frequency || frequency < 20) {
        console.log('❌ getNote - frequency too low:', frequency);
        return '';
      }

      try {
        const { note, octave } = frequencyToNote(frequency, standartPitch);
        console.log('✅ frequencyToNote result:', { note, octave });

        // Apply accidental system preference
        const displayNote = convertAccidental(note, accidentalSystem);
        console.log('✅ convertAccidental result:', displayNote);

        // Apply notation system preference
        const finalDisplayNote = getNoteDisplayName(
          displayNote,
          notationSystem
        );
        console.log('✅ getNoteDisplayName result:', finalDisplayNote);

        const result = finalDisplayNote + octave;
        console.log('✅ Final note string:', result);

        return result;
      } catch (error) {
        console.error('❌ Error in getNote:', error);
        return '';
      }
    },
    [standartPitch, notationSystem, accidentalSystem]
  );

  // Get exact frequency for a note using global standard pitch
  const getNoteFrequency = useCallback(
    (frequency: number): number => {
      if (!frequency || frequency < 20) return 0;
      const { note, octave } = frequencyToNote(frequency, standartPitch);

      // Calculate the exact frequency for this note
      const noteIndex = NOTE_NAMES_ABC.indexOf(note);
      if (noteIndex === -1) return frequency; // Fallback to original if note not found

      const semitonesFromA4 = (octave - 4) * 12 + (noteIndex - 9);
      return standartPitch * Math.pow(2, semitonesFromA4 / 12);
    },
    [standartPitch]
  );

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

  // Calculate horizontal position for notes - time-based scrolling
  const getNoteLeft = useCallback(
    (noteTimestamp: number, currentTime: number) => {
      const age = currentTime - noteTimestamp; // How long ago was this note?
      const maxAge = timeWindow * 1000; // Convert seconds to milliseconds

      // Calculate position based on age (newer notes on the right)
      const progress = age / maxAge;
      const rightEdge = 90; // Right edge at 90%
      const leftEdge = 10; // Left edge at 10%

      // Position from right to left based on age
      const position = rightEdge - progress * (rightEdge - leftEdge);

      // Clamp to visible area
      return Math.max(leftEdge, Math.min(rightEdge, position));
    },
    [timeWindow]
  );

  // Continuous animation loop for scrolling
  useEffect(() => {
    let lastCleanupTime = 0;

    const animate = () => {
      const now = Date.now();
      setCurrentTime(now);

      // Only cleanup old notes every 500ms to reduce unnecessary work
      if (now - lastCleanupTime > 500) {
        setLatestNotes((prev) => {
          const maxAge = timeWindow * 1000; // Use configurable time window
          const filtered = prev.filter((note) => now - note.timestamp < maxAge);

          // Only update state if something actually changed
          if (filtered.length !== prev.length) {
            console.log(
              `🧹 Cleaned up ${prev.length - filtered.length} old notes`
            );
            return filtered;
          }
          return prev;
        });
        lastCleanupTime = now;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [timeWindow]); // Add timeWindow dependency

  // Auto-start pitch detection
  useEffect(() => {
    if (!isActive) {
      console.log('🎤 StaffAnalyzer - Starting pitch detection...');
      start().catch((error) => {
        console.error(
          '🎤 StaffAnalyzer - Failed to start pitch detection:',
          error
        );
      });
    }

    return () => {
      if (isActive) {
        console.log('🎤 StaffAnalyzer - Stopping pitch detection...');
        stop();
      }
    };
  }, []); // Run once on mount

  // Test mode - generate sample notes
  useEffect(() => {
    if (!testMode) return;

    console.log(
      '🧪 StaffAnalyzer - Test mode enabled, generating sample notes...'
    );

    const generateTestNote = () => {
      const testNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
      const randomNote =
        testNotes[Math.floor(Math.random() * testNotes.length)];
      const testFrequency =
        261.63 * Math.pow(2, testNotes.indexOf(randomNote) / 12); // Approximate frequency

      setLatestNotes((prev) => {
        const newNote: NoteHistoryItem = {
          note: randomNote,
          freq: testFrequency,
          clarity: 0.8 + Math.random() * 0.2, // Random clarity between 0.8-1.0
          timestamp: Date.now(),
          isVisible: true,
        };

        console.log('🧪 StaffAnalyzer - Generated test note:', newNote);
        return [...prev, newNote];
      });
    };

    // Generate a note every 2 seconds
    const interval = setInterval(generateTestNote, 2000);

    // Generate first note immediately
    generateTestNote();

    return () => clearInterval(interval);
  }, [testMode]);

  // Clear note history
  const clearHistory = useCallback(() => {
    setLatestNotes([]);
  }, []);

  // Update settings helper
  const handleSettingChange = useCallback(
    (key: string, value: any) => {
      if (updateSetting) {
        updateSetting(key, value);
      }
    },
    [updateSetting]
  );

  // Add new notes - always add but mark visibility based on clarity
  useEffect(() => {
    console.log('🎵 StaffAnalyzer - Detection data:', {
      frequency,
      clarity,
      minClarity,
      hasFrequency: !!frequency,
      frequencyAbove50: frequency ? frequency > 50 : false,
      clarityAboveMin: clarity >= minClarity,
      testMode,
    });

    if (frequency && frequency > 50) {
      const now = Date.now();

      // Throttle note addition to prevent too many notes
      if (now - lastNoteTimeRef.current < 100) {
        console.log('🎵 StaffAnalyzer - Note throttled');
        return;
      }

      const noteString = getNote(frequency);
      console.log('🎵 StaffAnalyzer - Generated note:', noteString);

      if (noteString) {
        lastNoteTimeRef.current = now;

        setLatestNotes((prev) => {
          const newNote: NoteHistoryItem = {
            note: noteString,
            freq: frequency,
            clarity,
            timestamp: now,
            isVisible: clarity >= minClarity, // Only visible if meets clarity threshold
          };

          console.log('🎵 StaffAnalyzer - Adding note:', newNote);

          const newNotes = [...prev, newNote];

          // Don't limit by bufferSize here since time-based cleanup handles it
          console.log(
            '🎵 StaffAnalyzer - Total notes in buffer:',
            newNotes.length
          );
          console.log(
            '🎵 StaffAnalyzer - Visible notes:',
            newNotes.filter((n) => n.isVisible && !n.isTick).length
          );

          return newNotes;
        });
      } else {
        console.log(
          '❌ StaffAnalyzer - No note string generated for frequency:',
          frequency
        );
      }
    } else {
      if (frequency && frequency <= 50) {
        console.log('❌ StaffAnalyzer - Frequency too low:', frequency);
      } else if (!frequency) {
        // Only log this occasionally to avoid spam
        if (Math.random() < 0.01) {
          console.log('❌ StaffAnalyzer - No frequency detected');
        }
      }
    }
  }, [frequency, clarity, bufferSize, minClarity, getNote, testMode]);

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
            const newTick: NoteHistoryItem = {
              note: '',
              freq: 0,
              clarity: 0,
              timestamp: now,
              isTick: true,
              tickId: now,
              isVisible: true, // Metronome ticks are always visible
            };

            const newNotes = [...prev, newTick];
            return newNotes.slice(-bufferSize);
          });
        }
      }
    } else if (!metronomeIsPlaying) {
      // Reset when metronome stops
      previousBeatRef.current = 0;
    }
  }, [metronomeIsPlaying, currentBeat, bufferSize]);

  return (
    <div className='w-full h-full flex flex-col bg-transparent'>
      {/* Settings Panel */}
      {showSettings && (
        <div className='absolute top-2 right-2 z-20 bg-black/80 backdrop-blur-sm rounded-lg p-3 min-w-[200px]'>
          <div className='space-y-3'>
            {/* Buffer Size */}
            <div>
              <label className='block text-xs text-white/70 mb-1'>
                Buffer Size: {bufferSize}
              </label>
              <div className='flex items-center space-x-2'>
                <input
                  type='range'
                  min={10}
                  max={500}
                  value={bufferSize}
                  onChange={(e) =>
                    handleSettingChange('bufferSize', parseInt(e.target.value))
                  }
                  className='flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer'
                  aria-label={`Buffer size: ${bufferSize} notes`}
                  title={`Adjust buffer size (10-500 notes). Current: ${bufferSize}`}
                />
                <span className='text-xs text-white/50 w-8'>{bufferSize}</span>
              </div>
            </div>

            {/* Scroll Speed */}
            <div>
              <label className='block text-xs text-white/70 mb-1'>
                Scroll Speed: {scrollSpeed}px/s
              </label>
              <div className='flex items-center space-x-2'>
                <input
                  type='range'
                  min={20}
                  max={200}
                  value={scrollSpeed}
                  onChange={(e) =>
                    handleSettingChange('scrollSpeed', parseInt(e.target.value))
                  }
                  className='flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer'
                  aria-label={`Scroll speed: ${scrollSpeed} pixels per second`}
                  title={`Adjust scroll speed (20-200 px/s). Current: ${scrollSpeed}`}
                />
                <span className='text-xs text-white/50 w-12'>
                  {scrollSpeed}
                </span>
              </div>
            </div>

            {/* Time Window */}
            <div>
              <label className='block text-xs text-white/70 mb-1'>
                Time Window: {timeWindow}s
              </label>
              <div className='flex items-center space-x-2'>
                <input
                  type='range'
                  min={5}
                  max={30}
                  value={timeWindow}
                  onChange={(e) =>
                    handleSettingChange('timeWindow', parseInt(e.target.value))
                  }
                  className='flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer'
                  aria-label={`Time window: ${timeWindow} seconds`}
                  title={`Adjust time window (5-30s). Current: ${timeWindow}s`}
                />
                <span className='text-xs text-white/50 w-8'>{timeWindow}s</span>
              </div>
            </div>

            {/* Min Clarity */}
            <div>
              <label className='block text-xs text-white/70 mb-1'>
                Min Clarity: {(minClarity * 100).toFixed(0)}%
              </label>
              <div className='flex items-center space-x-2'>
                <input
                  type='range'
                  min={0.1}
                  max={0.9}
                  step={0.1}
                  value={minClarity}
                  onChange={(e) =>
                    handleSettingChange(
                      'minClarity',
                      parseFloat(e.target.value)
                    )
                  }
                  className='flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer'
                  aria-label={`Minimum clarity threshold: ${(
                    minClarity * 100
                  ).toFixed(0)}%`}
                  title={`Adjust minimum clarity threshold (10%-90%). Current: ${(
                    minClarity * 100
                  ).toFixed(0)}%`}
                />
                <span className='text-xs text-white/50 w-8'>
                  {(minClarity * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Test Mode */}
            <div>
              <label className='flex items-center space-x-2 text-xs text-white/70'>
                <input
                  type='checkbox'
                  checked={testMode}
                  onChange={(e) =>
                    handleSettingChange('testMode', e.target.checked)
                  }
                  className='rounded'
                />
                <span>Test Mode (Generate Sample Notes)</span>
              </label>
            </div>

            {/* Test Note Button */}
            <button
              onClick={() => {
                const testNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
                const randomNote =
                  testNotes[Math.floor(Math.random() * testNotes.length)];
                const testFrequency =
                  261.63 * Math.pow(2, testNotes.indexOf(randomNote) / 12);

                setLatestNotes((prev) => [
                  ...prev,
                  {
                    note: randomNote,
                    freq: testFrequency,
                    clarity: 0.9,
                    timestamp: Date.now(),
                    isVisible: true,
                  },
                ]);
              }}
              className='w-full px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 text-xs rounded border border-blue-400/30 transition-colors'
            >
              Add Test Note
            </button>

            {/* Clear History */}
            <button
              onClick={clearHistory}
              className='w-full px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs rounded border border-red-400/30 transition-colors'
            >
              Clear History
            </button>

            {/* Close Settings */}
            <button
              onClick={() => handleSettingChange('showSettings', false)}
              className='w-full px-3 py-1 bg-white/10 hover:bg-white/20 text-white/70 text-xs rounded border border-white/20 transition-colors'
            >
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* Header with Controls */}
      <div className='absolute top-2 left-3 right-3 flex justify-between items-center text-xs text-white/70 select-none z-10'>
        <div className='flex items-center space-x-3'>
          <span>Staff Analyzer</span>
          {/* Pitch detection status indicator */}
          <div className='flex items-center space-x-2'>
            <div
              className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span className='text-xs text-white/60'>
              {isActive ? 'Listening' : 'Microphone Off'}
            </span>
          </div>
          {/* Real-time pitch detection indicator */}
          {frequency && frequency > 50 && clarity > minClarity && (
            <div className='flex items-center space-x-1'>
              <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
              <span className='text-green-300 text-xs'>
                {getNote(frequency)} ({frequency.toFixed(1)}Hz)
              </span>
            </div>
          )}
          {/* Test mode indicator */}
          {testMode && (
            <div className='flex items-center space-x-1'>
              <div className='w-2 h-2 bg-blue-400 rounded-full animate-pulse' />
              <span className='text-blue-300 text-xs'>Test Mode</span>
            </div>
          )}
        </div>
        <div className='flex items-center space-x-2'>
          <span className='text-white/50'>
            Active Notes:{' '}
            {latestNotes.filter((n) => !n.isTick && n.isVisible).length}
          </span>
          <span className='text-white/40'>|</span>
          <span className='text-white/50'>
            Total: {latestNotes.filter((n) => !n.isTick).length}
          </span>
          {!isActive && (
            <button
              onClick={() => start().catch(console.error)}
              className='px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded text-xs transition-colors border border-green-400/30'
            >
              Start Microphone
            </button>
          )}
          {!showSettings && (
            <button
              onClick={() => handleSettingChange('showSettings', true)}
              className='px-2 py-1 bg-white/10 hover:bg-white/20 text-white/70 rounded text-xs transition-colors'
            >
              Settings
            </button>
          )}
        </div>
      </div>

      {/* Musical Staff */}
      <div className='flex-1 min-h-0'>
        <MusicalStaff
          notes={latestNotes}
          accuracyColor={accuracyColor}
          getNoteLeft={getNoteLeft}
          currentTime={currentTime}
          timeWindow={timeWindow}
        />
      </div>
    </div>
  );
};

export default StaffAnalyzerWidget;
