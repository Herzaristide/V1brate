'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export default function DroneNoteWidget() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedNote, setSelectedNote] = useState('A4');
  const [volume, setVolume] = useState(30);
  const [waveform, setWaveform] = useState<OscillatorType>('sine');

  // Common drone note frequencies
  const droneNotes = {
    C2: 65.41,
    C3: 130.81,
    C4: 261.63,
    D2: 73.42,
    D3: 146.83,
    D4: 293.66,
    E2: 82.41,
    E3: 164.81,
    E4: 329.63,
    F2: 87.31,
    F3: 174.61,
    F4: 349.23,
    G2: 98.0,
    G3: 196.0,
    G4: 392.0,
    A2: 110.0,
    A3: 220.0,
    A4: 440.0,
    B2: 123.47,
    B3: 246.94,
    B4: 493.88
  };

  // Initialize audio context
  const initAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  // Start playing drone note
  const startDrone = useCallback(async () => {
    try {
      await initAudioContext();

      if (!audioContextRef.current) return;

      // Stop any existing oscillator
      stopDrone();

      // Create new oscillator and gain node
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;

      // Configure oscillator
      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(
        droneNotes[selectedNote as keyof typeof droneNotes],
        audioContextRef.current.currentTime
      );

      // Configure gain with smooth fade-in
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        volume / 100,
        audioContextRef.current.currentTime + 0.1
      );

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Start oscillator
      oscillator.start();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error starting drone:', error);
    }
  }, [selectedNote, volume, waveform, initAudioContext]);

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

  // Toggle play/stop
  const toggleDrone = useCallback(() => {
    if (isPlaying) {
      stopDrone();
    } else {
      startDrone();
    }
  }, [isPlaying, startDrone, stopDrone]);

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
      oscillatorRef.current.frequency.setValueAtTime(
        droneNotes[selectedNote as keyof typeof droneNotes],
        audioContextRef.current.currentTime
      );
    }
  }, [selectedNote, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDrone();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopDrone]);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">Drone Notes</h3>
          <button
            onClick={toggleDrone}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isPlaying ? 'Stop' : 'Play'}
          </button>
        </div>

        {/* Current frequency display */}
        <div className="text-center mb-3">
          <div className="text-2xl font-mono text-blue-400">
            {droneNotes[selectedNote as keyof typeof droneNotes].toFixed(2)} Hz
          </div>
          <div className="text-sm text-gray-400">{selectedNote}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4">
        {/* Note Selection */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Note Selection
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(droneNotes).map((note) => (
              <button
                key={note}
                onClick={() => setSelectedNote(note)}
                className={`p-2 rounded text-sm font-medium transition-colors ${
                  selectedNote === note
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        {/* Volume Control */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Volume: {volume}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Waveform Selection */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            Waveform
          </label>
          <div className="grid grid-cols-2 gap-2">
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

        {/* Quick Actions */}
        <div className="pt-2 border-t border-gray-700">
          <div className="text-white text-sm font-medium mb-2">Quick Notes</div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedNote('A4')}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs"
            >
              A440 (Standard)
            </button>
            <button
              onClick={() => setSelectedNote('C4')}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs"
            >
              Middle C
            </button>
            <button
              onClick={() => setSelectedNote('G3')}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs"
            >
              Guitar Low E
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="text-xs text-gray-400 text-center pt-2">
          {isPlaying ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Playing drone at {selectedNote}
            </div>
          ) : (
            'Click Play to start drone note'
          )}
        </div>
      </div>
    </div>
  );
}
