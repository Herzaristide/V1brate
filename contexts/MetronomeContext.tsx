'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} from 'react';

interface MetronomeContextType {
  bpm: number;
  setBpm: (bpm: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  timeSignature: number;
  setTimeSignature: (signature: number) => void;
  currentBeat: number;
  onTick?: () => void;
  setOnTick: (callback: (() => void) | undefined) => void;
}

const MetronomeContext = createContext<MetronomeContextType | undefined>(
  undefined
);

export const useMetronome = () => {
  const context = useContext(MetronomeContext);
  if (!context) {
    throw new Error('useMetronome must be used within a MetronomeProvider');
  }
  return context;
};

interface MetronomeProviderProps {
  children: React.ReactNode;
}

export const MetronomeProvider: React.FC<MetronomeProviderProps> = ({
  children
}) => {
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSignature, setTimeSignature] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [onTick, setOnTick] = useState<(() => void) | undefined>(undefined);
  const onTickRef = useRef<(() => void) | undefined>(undefined);

  // Memoize setOnTick to prevent unnecessary re-renders
  const memoizedSetOnTick = useCallback(
    (callback: (() => void) | undefined) => {
      console.log(
        'memoizedSetOnTick called with:',
        callback ? 'function' : 'undefined'
      );
      setOnTick(callback);
    },
    []
  );

  // Update ref when onTick changes
  useEffect(() => {
    console.log(
      'Updating onTickRef.current with:',
      onTick ? 'function' : 'undefined'
    );
    onTickRef.current = onTick;
  }, [onTick]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audio2Ref = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/Tick.mp3');
      audio2Ref.current = new Audio('/sounds/Tick2.wav');
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle metronome timing
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isPlaying) {
      const tick = () => {
        console.log('Metronome tick function called');
        setCurrentBeat((prevBeat) => {
          const nextBeat = prevBeat >= timeSignature ? 1 : prevBeat + 1;
          console.log('Beat:', nextBeat);

          // Play appropriate sound
          if (nextBeat === 1) {
            audio2Ref.current?.play().catch(console.error);
          } else {
            audioRef.current?.play().catch(console.error);
          }

          // Call external tick callback using ref
          if (onTickRef.current) {
            console.log('Metronome context calling tick callback');
            onTickRef.current();
          } else {
            console.log('No tick callback registered');
          }

          return nextBeat;
        });
      };

      console.log('Setting up metronome interval with BPM:', bpm);
      intervalRef.current = setInterval(tick, (60 / bpm) * 1000);
    } else {
      setCurrentBeat(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, bpm, timeSignature]); // Stable dependencies

  const value: MetronomeContextType = useMemo(
    () => ({
      bpm,
      setBpm,
      isPlaying,
      setIsPlaying,
      timeSignature,
      setTimeSignature,
      currentBeat,
      onTick,
      setOnTick: memoizedSetOnTick
    }),
    [bpm, isPlaying, timeSignature, currentBeat, onTick, memoizedSetOnTick]
  );

  return (
    <MetronomeContext.Provider value={value}>
      {children}
    </MetronomeContext.Provider>
  );
};
