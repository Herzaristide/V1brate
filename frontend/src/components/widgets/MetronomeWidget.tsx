import React, { useState, useEffect, useCallback } from 'react';
import { useMetronome } from '../../contexts/MetronomeContext';
import { Play, Pause, Square } from 'lucide-react';

interface MetronomeWidgetProps {
  settings?: Record<string, any>;
  updateSetting?: (key: string, value: any) => void;
}

const MetronomeWidget: React.FC<MetronomeWidgetProps> = ({
  settings = {},
  updateSetting,
}) => {
  const {
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
  } = useMetronome();

  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load settings
  useEffect(() => {
    if (settings.metronomeBpm) setBpm(settings.metronomeBpm);
    if (settings.metronomeTimeSignature)
      setTimeSignature(settings.metronomeTimeSignature);
    if (settings.metronomeVolume) setVolume(settings.metronomeVolume);
    if (settings.metronomeSound) setSound(settings.metronomeSound);
  }, [settings, setBpm, setTimeSignature, setVolume, setSound]);

  // Save settings when they change
  useEffect(() => {
    if (updateSetting) {
      updateSetting('metronomeBpm', bpm);
      updateSetting('metronomeTimeSignature', timeSignature);
      updateSetting('metronomeVolume', volume);
      updateSetting('metronomeSound', sound);
    }
  }, [bpm, timeSignature, volume, sound, updateSetting]);

  // Tap tempo
  const handleTap = useCallback(() => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now].slice(-4); // Keep last 4 taps

    if (newTapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }

      const averageInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / averageInterval);

      if (calculatedBpm >= 40 && calculatedBpm <= 300) {
        setBpm(calculatedBpm);
      }
    }

    setTapTimes(newTapTimes);
  }, [tapTimes, setBpm]);

  // Clear tap times after 3 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setTapTimes([]);
    }, 3000);

    return () => clearTimeout(timer);
  }, [tapTimes]);

  // BPM input handling
  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 40 && value <= 300) {
      setBpm(value);
    }
  };

  // BPM adjustment buttons
  const adjustBpm = (delta: number) => {
    const newBpm = Math.max(40, Math.min(300, bpm + delta));
    setBpm(newBpm);
  };

  // Get beat indicator classes
  const getBeatIndicatorClass = (beatNumber: number) => {
    const isActive = currentBeat === beatNumber;
    const isAccent = beatNumber === 1;

    if (isActive) {
      return isAccent
        ? 'bg-red-500 border-red-600 scale-110'
        : 'bg-blue-500 border-blue-600 scale-110';
    }

    return isAccent
      ? 'bg-red-200 dark:bg-red-800 border-red-300 dark:border-red-700'
      : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Main Controls */}
      <div className='flex items-center justify-center space-x-4 mb-6'>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-3 rounded-full transition-colors ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isPlaying ? (
            <Pause className='h-6 w-6' />
          ) : (
            <Play className='h-6 w-6' />
          )}
        </button>

        <button
          onClick={() => setIsPlaying(false)}
          className='p-3 rounded-full bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
        >
          <Square className='h-6 w-6' />
        </button>
      </div>

      {/* BPM Display and Controls */}
      <div className='text-center mb-6'>
        <div className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
          {bpm} BPM
        </div>

        <div className='flex items-center justify-center space-x-2 mb-4'>
          <button
            onClick={() => adjustBpm(-10)}
            className='px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm'
          >
            -10
          </button>
          <button
            onClick={() => adjustBpm(-1)}
            className='px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm'
          >
            -1
          </button>

          <input
            type='number'
            min='40'
            max='300'
            value={bpm}
            onChange={handleBpmChange}
            className='w-16 text-center border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700'
          />

          <button
            onClick={() => adjustBpm(1)}
            className='px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm'
          >
            +1
          </button>
          <button
            onClick={() => adjustBpm(10)}
            className='px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm'
          >
            +10
          </button>
        </div>

        <button
          onClick={handleTap}
          className='px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium'
        >
          Tap Tempo
        </button>
      </div>

      {/* Beat Indicator */}
      <div className='flex justify-center space-x-2 mb-6'>
        {[...Array(timeSignature)].map((_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full border-2 transition-all duration-100 ${getBeatIndicatorClass(
              i + 1
            )}`}
          >
            <div className='w-full h-full flex items-center justify-center text-xs font-bold'>
              {i + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className='text-sm text-blue-500 hover:text-blue-600 mb-2'
      >
        {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className='space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
          {/* Time Signature */}
          <div>
            <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Time Signature
            </label>
            <select
              value={timeSignature}
              onChange={(e) => setTimeSignature(parseInt(e.target.value))}
              className='w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700'
            >
              <option value={2}>2/4</option>
              <option value={3}>3/4</option>
              <option value={4}>4/4</option>
              <option value={5}>5/4</option>
              <option value={6}>6/8</option>
              <option value={7}>7/8</option>
            </select>
          </div>

          {/* Volume */}
          <div>
            <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Volume: {Math.round(volume * 100)}%
            </label>
            <input
              type='range'
              min='0'
              max='1'
              step='0.1'
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className='w-full'
            />
          </div>

          {/* Sound Type */}
          <div>
            <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Sound
            </label>
            <select
              value={sound}
              onChange={(e) => setSound(e.target.value as any)}
              className='w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700'
            >
              <option value='click'>Click</option>
              <option value='beep'>Beep</option>
              <option value='wood'>Wood Block</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetronomeWidget;
