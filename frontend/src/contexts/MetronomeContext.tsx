import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

interface MetronomeContextType {
  bpm: number;
  setBpm: (bpm: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  timeSignature: number;
  setTimeSignature: (signature: number) => void;
  currentBeat: number;
  volume: number;
  setVolume: (volume: number) => void;
  sound: 'click' | 'beep' | 'wood';
  setSound: (sound: 'click' | 'beep' | 'wood') => void;
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
  children,
}) => {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSignature, setTimeSignature] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [sound, setSound] = useState<'click' | 'beep' | 'wood'>('click');
  const [onTick, setOnTick] = useState<(() => void) | undefined>(undefined);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const onTickRef = useRef<(() => void) | undefined>(undefined);

  // Update tick callback ref
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play metronome sound
  const playTick = useCallback(
    (isAccent = false) => {
      if (!audioContextRef.current) return;

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Different frequencies for different sounds and accents
      let frequency = 800;
      let duration = 0.1;

      switch (sound) {
        case 'click':
          frequency = isAccent ? 1200 : 800;
          duration = 0.05;
          break;
        case 'beep':
          frequency = isAccent ? 1000 : 600;
          duration = 0.1;
          break;
        case 'wood':
          frequency = isAccent ? 2000 : 1000;
          duration = 0.03;
          break;
      }

      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.type = sound === 'wood' ? 'square' : 'sine';

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        volume * (isAccent ? 1 : 0.7),
        ctx.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + duration
      );

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    },
    [sound, volume]
  );

  // Metronome timer logic
  useEffect(() => {
    if (isPlaying) {
      const interval = 60000 / bpm; // milliseconds per beat

      intervalRef.current = setInterval(() => {
        setCurrentBeat((prevBeat) => {
          const newBeat = (prevBeat % timeSignature) + 1;
          const isAccent = newBeat === 1;

          playTick(isAccent);

          // Call custom tick callback
          if (onTickRef.current) {
            onTickRef.current();
          }

          return newBeat;
        });
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentBeat(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, bpm, timeSignature, playTick]);

  const value: MetronomeContextType = {
    bpm,
    setBpm,
    isPlaying,
    setIsPlaying,
    timeSignature,
    setTimeSignature,
    currentBeat,
    volume,
    setVolume,
    sound,
    setSound,
    onTick,
    setOnTick,
  };

  return (
    <MetronomeContext.Provider value={value}>
      {children}
    </MetronomeContext.Provider>
  );
};
