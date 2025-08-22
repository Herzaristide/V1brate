import React, { useState, useEffect, useCallback } from 'react';
import { usePitchDetection } from '../../hooks/usePitchDetection';
import { useMetronome } from '../../contexts/MetronomeContext';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { NotationSystem, MusicalKey } from '../../types';

interface TunerWidgetProps {
  selectedMicrophone?: string;
  settings?: Record<string, any>;
  updateSetting?: (key: string, value: any) => void;
  preferredKey?: MusicalKey;
  notationSystem?: NotationSystem;
}

const TunerWidget: React.FC<TunerWidgetProps> = ({
  selectedMicrophone,
  settings = {},
  updateSetting,
  notationSystem = 'ABC',
}) => {
  const { standartPitch, accidentalSystem } = useUserPreferences();
  const [sensitivity, setSensitivity] = useState(
    settings.tunerSensitivity || 0.3
  );

  const { frequency, clarity, note, octave, cents, start, stop } =
    usePitchDetection(selectedMicrophone);

  // Update settings when they change
  useEffect(() => {
    if (updateSetting) {
      updateSetting('tunerSensitivity', sensitivity);
    }
  }, [sensitivity, updateSetting]);

  // Start tuner when widget mounts and stop when unmounted
  useEffect(() => {
    let mounted = true;
    const startIfAvailable = async () => {
      try {
        await start();
      } catch (e) {
        // ignore start errors
      }
    };
    if (mounted) startIfAvailable();

    return () => {
      mounted = false;
      try {
        stop();
      } catch (e) {
        // ignore
      }
    };
    // intentionally run once on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Convert note name based on notation system and accidental preference
  function getDisplayNote(noteName: string) {
    if (notationSystem === 'DoReMi') {
      if (accidentalSystem === 'flat') {
        const flatMap: Record<string, string> = {
          C: 'Do',
          'C♯': 'Ré♭',
          D: 'Ré',
          'D♯': 'Mi♭',
          E: 'Mi',
          F: 'Fa',
          'F♯': 'Sol♭',
          G: 'Sol',
          'G♯': 'La♭',
          A: 'La',
          'A♯': 'Si♭',
          B: 'Si',
        };
        return flatMap[noteName] || noteName;
      }

      const noteMap: Record<string, string> = {
        C: 'Do',
        'C♯': 'Do♯',
        D: 'Ré',
        'D♯': 'Ré♯',
        E: 'Mi',
        F: 'Fa',
        'F♯': 'Fa♯',
        G: 'Sol',
        'G♯': 'Sol♯',
        A: 'La',
        'A♯': 'La♯',
        B: 'Si',
      };
      return noteMap[noteName] || noteName;
    }

    if (accidentalSystem === 'flat') {
      const enharmonic: Record<string, string> = {
        'C♯': 'D♭',
        'D♯': 'E♭',
        'F♯': 'G♭',
        'G♯': 'A♭',
        'A♯': 'B♭',
      };
      return enharmonic[noteName] || noteName;
    }

    return noteName;
  }

  // Get needle position for the meter (-50 to +50 cents)
  const getNeedlePosition = () => {
    if (!frequency || clarity < sensitivity) return 0;
    return Math.max(-50, Math.min(50, cents));
  };

  // Get color based on cents deviation
  const getCentsColor = () => {
    if (!frequency || clarity < sensitivity) return 'text-gray-400';
    const absCents = Math.abs(cents);
    if (absCents <= 5) return 'text-green-500';
    if (absCents <= 15) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get tuning accuracy text
  const getAccuracyText = () => {
    if (!frequency || clarity < sensitivity) return 'No signal';
    const absCents = Math.abs(cents);
    if (absCents <= 5) return 'In tune';
    if (absCents <= 15) return 'Close';
    return cents > 0 ? 'Sharp' : 'Flat';
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Controls (tuner runs while widget is mounted) */}
      <div className='flex items-center justify-between mb-4'>
        <div className='text-xs text-gray-500 dark:text-gray-400'>
          A = {standartPitch}Hz
        </div>
      </div>

      {/* Main Display */}
      <div className='flex-1 flex flex-col items-center justify-center space-y-4'>
        {/* Note Display */}
        <div className='text-center'>
          <div className='text-4xl font-bold text-gray-900 dark:text-white'>
            {frequency && clarity >= sensitivity ? getDisplayNote(note) : '—'}
          </div>
          <div className='text-lg text-gray-600 dark:text-gray-300'>
            {frequency && clarity >= sensitivity ? octave : ''}
          </div>
        </div>

        {/* Frequency Display */}
        <div className='text-center'>
          <div className='text-xl font-mono text-gray-700 dark:text-gray-300'>
            {frequency && clarity >= sensitivity
              ? `${frequency.toFixed(1)} Hz`
              : '— Hz'}
          </div>
        </div>

        {/* Tuning Meter */}
        <div className='w-full max-w-xs'>
          <div className='relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
            {/* Background gradient */}
            <div className='absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-yellow-500 to-red-500'></div>

            {/* Center line */}
            <div className='absolute left-1/2 transform -translate-x-0.5 top-0 bottom-0 w-0.5 bg-black dark:bg-white opacity-50'></div>

            {/* Needle */}
            {frequency && clarity >= sensitivity && (
              <div
                className='absolute top-1 bottom-1 w-1 bg-black dark:bg-white rounded transition-all duration-150'
                style={{
                  left: `calc(50% + ${(getNeedlePosition() / 50) * 40}% - 2px)`,
                }}
              ></div>
            )}
          </div>

          {/* Scale markings */}
          <div className='flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1'>
            <span>-50¢</span>
            <span>0</span>
            <span>+50¢</span>
          </div>
        </div>

        {/* Cents and Status */}
        <div className='text-center'>
          <div className={`text-xl font-bold ${getCentsColor()}`}>
            {frequency && clarity >= sensitivity
              ? `${cents > 0 ? '+' : ''}${cents}¢`
              : '—'}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-300'>
            {getAccuracyText()}
          </div>
        </div>

        {/* Signal Strength */}
        <div className='flex items-center space-x-2'>
          <span className='text-xs text-gray-500 dark:text-gray-400'>
            Signal:
          </span>
          <div className='flex space-x-1'>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-4 rounded ${
                  clarity > (i + 1) * 0.2
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
        <div className='space-y-3'>
          <div>
            <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Sensitivity: {(sensitivity * 100).toFixed(0)}%
            </label>
            <input
              type='range'
              min='0.1'
              max='1'
              step='0.1'
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className='w-full'
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TunerWidget;
