'use client';

import { usePitchDetection } from '../../utils/usePitchDetection';
import MusicalStaff from './tuner/MusicalStaff';
import React from 'react';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';

const Tuner = React.memo(() => {
  const { freq, clarity } = usePitchDetection();
  const [latestNotes, setLatestNotes] = useState<
    Array<{
      note: string;
      freq: number;
      clarity: number;
      isTick?: boolean;
    }>
  >([]);

  // Metronome state
  const [bpm, setBpm] = useState(60);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [accentEnabled, setAccentEnabled] = useState(true);
  const [metronomeVolume, setMetronomeVolume] = useState(0.2);
  const [metronomeSound, setMetronomeSound] = useState('click'); // 'click', 'beep', 'wood'

  // Note range state
  const [noteRange, setNoteRange] = useState<
    'violin' | 'piano' | 'guitar' | 'bass' | 'custom'
  >('violin');
  const [customLowNote, setCustomLowNote] = useState('C3');
  const [customHighNote, setCustomHighNote] = useState('C6');
  const [scrollingEnabled, setScrollingEnabled] = useState(true);
  const [noteCount, setNoteCount] = useState(250); // Number of notes to display

  const metronomeInterval = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beatCountRef = useRef<number>(0);

  // Cleanup function for audio context
  const cleanupAudioContext = useCallback(() => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      cleanupAudioContext();
      if (metronomeInterval.current) {
        clearInterval(metronomeInterval.current);
        metronomeInterval.current = null;
      }
    };
  }, [cleanupAudioContext]);

  // Periodic cleanup of notes to prevent memory leaks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setLatestNotes((prev) => {
        // If we have too many notes, keep only the most recent ones
        if (prev.length > noteCount * 2) {
          return prev.slice(-noteCount);
        }
        return prev;
      });
    }, 30000); // Clean up every 30 seconds

    return () => clearInterval(cleanupInterval);
  }, [noteCount]);

  // Optimized helper functions with shared calculations
  const A4 = 442;
  const NOTES = useMemo(
    () => ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'],
    []
  );

  const calculateSemitones = useCallback((freq: number) => {
    return 12 * Math.log2(freq / A4);
  }, []);

  const frequencyToNote = useCallback(
    (freq: number | null) => {
      if (!freq) return '--';
      const semitones = calculateSemitones(freq);
      const noteIndex = Math.round(semitones) + 57;
      const note = NOTES[noteIndex % 12];
      const octave = Math.floor(noteIndex / 12);
      return `${note}${octave}`;
    },
    [calculateSemitones, NOTES]
  );

  const noteAccuracy = useCallback(
    (freq: number | null) => {
      if (!freq) return '--';
      const semitones = calculateSemitones(freq);
      const nearest = Math.round(semitones);
      const nearestFreq = A4 * Math.pow(2, nearest / 12);
      const cents = 1200 * Math.log2(freq / nearestFreq);
      return `${cents > 0 ? '+' : ''}${cents.toFixed(0)}`;
    },
    [calculateSemitones]
  );

  const accuracyColor = useCallback(
    (freq: number | null) => {
      if (!freq) return 'bg-gray-400';
      const semitones = calculateSemitones(freq);
      const nearest = Math.round(semitones);
      const nearestFreq = A4 * Math.pow(2, nearest / 12);
      const cents = Math.abs(1200 * Math.log2(freq / nearestFreq));

      if (cents < 5) return 'bg-green-500';
      if (cents < 15) return 'bg-yellow-400';
      if (cents < 30) return 'bg-orange-400';
      return 'bg-red-500';
    },
    [calculateSemitones]
  );

  // Optimized metronome sound generation with cached audio context
  const playMetronomeTick = useCallback(
    (isAccent = false) => {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        try {
          audioCtxRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        } catch (error) {
          console.warn('Failed to create AudioContext:', error);
          return;
        }
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Pre-calculated sound configurations for better performance
        const soundConfig =
          metronomeSound === 'beep'
            ? { type: 'sine' as OscillatorType, freq: isAccent ? 1200 : 800 }
            : metronomeSound === 'wood'
            ? {
                type: 'triangle' as OscillatorType,
                freq: isAccent ? 2000 : 1500
              }
            : {
                type: 'square' as OscillatorType,
                freq: isAccent ? 1200 : 1000
              };

        osc.type = soundConfig.type;
        osc.frequency.value = soundConfig.freq;
        gain.gain.value = isAccent ? metronomeVolume * 1.5 : metronomeVolume;

        osc.connect(gain).connect(ctx.destination);

        const startTime = ctx.currentTime;
        const duration = isAccent ? 0.1 : 0.07;

        osc.start(startTime);
        osc.stop(startTime + duration);

        // Clean up oscillator after it stops
        osc.addEventListener('ended', () => {
          osc.disconnect();
          gain.disconnect();
        });
      } catch (error) {
        console.warn('Failed to play metronome tick:', error);
      }
    },
    [metronomeSound, metronomeVolume]
  );

  // Optimized note positioning calculation with dynamic buffer size
  const getNoteLeft = useCallback(
    (idx: number, total: number) => {
      const relativeIdx = idx - Math.max(0, total - noteCount);
      return `calc(${(relativeIdx / noteCount) * 80}% - 4px)`;
    },
    [noteCount]
  );

  // Memoized range change handler
  const handleRangeChange = useCallback((lowNote: string, highNote: string) => {
    setCustomLowNote(lowNote);
    setCustomHighNote(highNote);
  }, []);

  // Store the latest notes with minimal delay optimization
  const addNoteRef = useRef<number>(0);
  const lastFreqRef = useRef<number>(0);

  // Optimized note update logic with memoized note generation
  const updateThrottleRef = useRef<number>(0);

  useEffect(() => {
    if (!freq || !scrollingEnabled) return;

    const now = performance.now();
    const timeSinceLastUpdate = now - addNoteRef.current;
    const freqChange = Math.abs(freq - lastFreqRef.current);

    // Standard throttling at 60fps (16ms) with frequency change threshold
    if (freqChange <= 10 && timeSinceLastUpdate < 16) return;

    addNoteRef.current = now;
    lastFreqRef.current = freq;

    const note = frequencyToNote(freq);
    setLatestNotes((prev) => {
      // Ensure we don't exceed the maximum note count to prevent memory issues
      const maxNotes = Math.min(noteCount, 1000); // Cap at 1000 notes for safety
      const newNote = { note, freq, clarity };

      if (prev.length >= maxNotes) {
        // Replace the oldest note instead of growing the array
        const newNotes = [...prev.slice(1), newNote];
        return newNotes;
      } else {
        return [...prev, newNote];
      }
    });
  }, [freq, clarity, frequencyToNote, scrollingEnabled, noteCount]);

  // Optimized metronome effect with pre-calculated interval
  useEffect(() => {
    // Clean up existing interval
    if (metronomeInterval.current) {
      clearInterval(metronomeInterval.current);
      metronomeInterval.current = null;
    }

    if (!metronomeEnabled) return;

    const interval = 60000 / bpm;
    const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
    beatCountRef.current = 0;

    metronomeInterval.current = setInterval(() => {
      const isAccent =
        accentEnabled && beatCountRef.current % beatsPerMeasure === 0;
      playMetronomeTick(isAccent);
      beatCountRef.current = (beatCountRef.current + 1) % beatsPerMeasure;

      // Optimized metronome tick marking - only if we have notes
      setLatestNotes((prev) => {
        if (prev.length === 0) return prev;
        const newNotes = [...prev];
        const lastIndex = newNotes.length - 1;
        if (lastIndex >= 0) {
          newNotes[lastIndex] = { ...newNotes[lastIndex], isTick: true };
        }
        return newNotes;
      });
    }, interval);

    // Cleanup function
    return () => {
      if (metronomeInterval.current) {
        clearInterval(metronomeInterval.current);
        metronomeInterval.current = null;
      }
    };
  }, [bpm, metronomeEnabled, timeSignature, accentEnabled, playMetronomeTick]);

  // Current note display
  const currentNote = useMemo(
    () => frequencyToNote(freq),
    [freq, frequencyToNote]
  );
  const currentAccuracy = useMemo(
    () => noteAccuracy(freq),
    [freq, noteAccuracy]
  );
  const currentColor = useMemo(
    () => accuracyColor(freq),
    [freq, accuracyColor]
  );

  // Calculate color ratio for visible notes - memoized with throttling
  const colorRatio = useMemo(() => {
    if (!latestNotes.length) return null;

    let green = 0,
      yellow = 0,
      orange = 0,
      red = 0;

    // Only calculate for the most recent notes to improve performance
    const notesToAnalyze = latestNotes.slice(
      -Math.min(100, latestNotes.length)
    );

    notesToAnalyze.forEach((n) => {
      const color = accuracyColor(n.freq);
      if (color.includes('green')) green++;
      else if (color.includes('yellow')) yellow++;
      else if (color.includes('orange')) orange++;
      else if (color.includes('red')) red++;
    });

    const total = green + yellow + orange + red;
    if (total === 0) return null;

    return {
      green: (green / total) * 100,
      yellow: (yellow / total) * 100,
      orange: (orange / total) * 100,
      red: (red / total) * 100,
      total
    };
  }, [latestNotes, accuracyColor]);

  return (
    <div className="p-4 w-full h-full text-[#eae1d6] flex flex-col overflow-hidden">
      {/* Main Tuner Display */}
      <div className="w-full flex flex-col justify-center items-center flex-shrink-0 gap-2">
        {/* Frequency Display */}
        <div className="backdrop-blur-md bg-white/10 rounded-2xl px-6 py-3 border border-white/20 shadow-lg w-32">
          <p className="text-xl font-light text-center text-white/90 truncate">
            {freq ? `${freq.toFixed(0)} Hz` : '--'}
          </p>
        </div>

        {/* Note Color Ratio Display */}
        {colorRatio && (
          <div className="flex gap-2 mt-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 border border-white/30"></span>
              {colorRatio.green.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 border border-white/30"></span>
              {colorRatio.yellow.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-orange-400 border border-white/30"></span>
              {colorRatio.orange.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 border border-white/30"></span>
              {colorRatio.red.toFixed(0)}%
            </span>
            <span className="ml-2 text-white/40">
              ({colorRatio.total} notes)
            </span>
          </div>
        )}

        {/* Note Display */}
        <div className="relative">
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 shadow-2xl w-32">
            <p className="text-5xl font-mono text-center text-white drop-shadow-lg">
              {currentNote}
            </p>
          </div>
        </div>

        {/* Accuracy Indicator */}
        <div className="flex gap-3 justify-between items-center w-30">
          <div className="relative">
            <div
              className={`w-5 h-5 rounded-full ${currentColor} shadow-lg ring-2 ring-white/30`}
            >
              <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
            </div>
          </div>
          <div className="backdrop-blur-md bg-white/10 rounded-lg px-3 py-1 border border-white/20 w-16 text-center">
            <p className="text-sm font-medium text-white/90">
              {currentAccuracy}
            </p>
          </div>
        </div>

        {/* Compact Metronome Controls */}
        <div className="backdrop-blur-md bg-white/5 rounded-xl p-2 border border-white/10 shadow-lg mt-2 w-full max-w-4xl">
          <div className="flex items-center justify-center gap-3 flex-wrap text-xs">
            {/* BPM and Start/Stop */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={20}
                max={300}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-14 h-7 text-white bg-white/10 backdrop-blur-md rounded-lg px-2 py-1 border border-white/20 focus:border-white/40 focus:outline-none transition-all duration-200 text-xs"
                title="Metronome BPM"
              />
              <span className="text-xs text-white/80">BPM</span>
              <button
                onClick={() => setMetronomeEnabled(!metronomeEnabled)}
                className={`px-3 py-1 rounded-lg font-medium text-xs transition-all duration-200 ${
                  metronomeEnabled
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-white/10 backdrop-blur-md border border-white/20 text-white/90 hover:bg-white/15'
                }`}
              >
                {metronomeEnabled ? 'Stop' : 'Start'}
              </button>
            </div>

            {/* Time Signature */}
            <div className="flex items-center gap-1">
              <label className="text-white/80 text-xs">Time:</label>
              <select
                value={timeSignature}
                onChange={(e) => setTimeSignature(e.target.value)}
                className="bg-white/10 backdrop-blur-md text-white rounded-md px-2 py-1 border border-white/20 focus:border-white/40 focus:outline-none transition-all duration-200 text-xs"
                aria-label="Time signature selection"
              >
                <option value="2/4" className="bg-gray-800">
                  2/4
                </option>
                <option value="3/4" className="bg-gray-800">
                  3/4
                </option>
                <option value="4/4" className="bg-gray-800">
                  4/4
                </option>
                <option value="6/8" className="bg-gray-800">
                  6/8
                </option>
                <option value="7/8" className="bg-gray-800">
                  7/8
                </option>
                <option value="9/8" className="bg-gray-800">
                  9/8
                </option>
                <option value="12/8" className="bg-gray-800">
                  12/8
                </option>
              </select>
            </div>

            {/* Accent */}
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={accentEnabled}
                onChange={(e) => setAccentEnabled(e.target.checked)}
                className="w-3 h-3 rounded border-white/20 bg-white/10 text-blue-500"
              />
              <span className="text-white/80 text-xs">Accent</span>
            </label>

            {/* Sound Type */}
            <div className="flex items-center gap-1">
              <label className="text-white/80 text-xs">Sound:</label>
              <select
                value={metronomeSound}
                onChange={(e) => setMetronomeSound(e.target.value)}
                className="bg-white/10 backdrop-blur-md text-white rounded-md px-2 py-1 border border-white/20 focus:border-white/40 focus:outline-none transition-all duration-200 text-xs"
                aria-label="Metronome sound type selection"
              >
                <option value="click" className="bg-gray-800">
                  Click
                </option>
                <option value="beep" className="bg-gray-800">
                  Beep
                </option>
                <option value="wood" className="bg-gray-800">
                  Wood
                </option>
              </select>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-1">
              <label className="text-white/80 text-xs">Vol:</label>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.1"
                value={metronomeVolume}
                onChange={(e) => setMetronomeVolume(Number(e.target.value))}
                className="w-12 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                title={`Volume: ${Math.round(metronomeVolume * 100)}%`}
              />
            </div>

            {/* Note Range Selector */}
            <div className="flex items-center gap-1">
              <label className="text-white/80 text-xs">Range:</label>
              <select
                value={noteRange}
                onChange={(e) => setNoteRange(e.target.value as any)}
                className="bg-white/10 backdrop-blur-md text-white rounded-md px-2 py-1 border border-white/20 focus:border-white/40 focus:outline-none transition-all duration-200 text-xs"
                aria-label="Note range selection"
              >
                <option value="violin" className="bg-gray-800">
                  Violin
                </option>
                <option value="guitar" className="bg-gray-800">
                  Guitar
                </option>
                <option value="bass" className="bg-gray-800">
                  Bass
                </option>
                <option value="piano" className="bg-gray-800">
                  Piano
                </option>
                <option value="custom" className="bg-gray-800">
                  Custom
                </option>
              </select>
            </div>

            {/* Scrolling Control */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setScrollingEnabled(!scrollingEnabled)}
                className={`px-3 py-1 rounded-lg font-medium text-xs transition-all duration-200 ${
                  scrollingEnabled
                    ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white/90 hover:bg-white/15'
                    : 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                }`}
                title={
                  scrollingEnabled ? 'Pause scrolling' : 'Resume scrolling'
                }
              >
                {scrollingEnabled ? 'Pause' : 'Play'}
              </button>
            </div>

            {/* Scrolling Speed */}
            <div className="flex items-center gap-1">
              <label className="text-white/80 text-xs">Notes:</label>
              <input
                type="number"
                min={10}
                max={500}
                value={Math.min(noteCount, 500)}
                onChange={(e) =>
                  setNoteCount(Math.min(Number(e.target.value), 500))
                }
                className="w-16 h-7 text-white bg-white/10 backdrop-blur-md rounded-lg px-2 py-1 border border-white/20 focus:border-white/40 focus:outline-none transition-all duration-200 text-xs"
                disabled={!scrollingEnabled}
                title={`Number of notes to display: ${noteCount} (max 500)`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Musical Staff */}
      <div className="flex-1 w-full backdrop-blur-md bg-white/5 rounded-2xl p-4 border border-white/10 shadow-lg mt-4 min-h-0 overflow-hidden">
        <MusicalStaff
          notes={latestNotes}
          accuracyColor={accuracyColor}
          getNoteLeft={getNoteLeft}
          noteRange={noteRange}
          customLowNote={customLowNote}
          customHighNote={customHighNote}
          onRangeChange={handleRangeChange}
        />
      </div>
    </div>
  );
});

Tuner.displayName = 'Tuner';

export default Tuner;
