import { PitchDetector } from 'pitchy';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useUserPreferences } from '../contexts/UserPreferencesContext';

export interface PitchDetectionResult {
  frequency: number | null;
  clarity: number;
  note: string;
  octave: number;
  cents: number;
}

export function usePitchDetection(deviceId?: string) {
  const { standartPitch } = useUserPreferences();
  const [result, setResult] = useState<PitchDetectionResult>({
    frequency: null,
    clarity: 0,
    note: '',
    octave: 0,
    cents: 0,
  });

  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false); // Add ref to prevent race conditions
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isMountedRef = useRef(true);

  // Convert frequency to note information
  const frequencyToNote = useCallback(
    (frequency: number) => {
      if (!frequency || frequency < 20) {
        return { note: '', octave: 0, cents: 0 };
      }

      const A4 = standartPitch;
      const noteNames = [
        'C',
        'C♯',
        'D',
        'D♯',
        'E',
        'F',
        'F♯',
        'G',
        'G♯',
        'A',
        'A♯',
        'B',
      ];

      const semitonesFromA4 = 12 * Math.log2(frequency / A4);
      const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;
      const noteIndex = Math.round(semitonesFromA4) % 12;
      const adjustedNoteIndex = (noteIndex + 9) % 12;

      // Calculate cents deviation
      const exactSemitones = 12 * Math.log2(frequency / A4);
      const roundedSemitones = Math.round(exactSemitones);
      const cents = Math.round((exactSemitones - roundedSemitones) * 100);

      return {
        note: noteNames[adjustedNoteIndex],
        octave,
        cents,
      };
    },
    [standartPitch]
  );

  // Keep a ref to the latest frequencyToNote so the running update loop
  // can use the newest standard pitch without restarting detection
  const frequencyToNoteRef = useRef(frequencyToNote);
  useEffect(() => {
    frequencyToNoteRef.current = frequencyToNote;
  }, [frequencyToNote]);

  // Start pitch detection
  const start = useCallback(async () => {
    console.log('[PitchDetection] Starting pitch detection with pitchy...', {
      deviceId,
      isActive: isActiveRef.current,
    });

    if (isActiveRef.current) {
      console.log('[PitchDetection] Already active, skipping start');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };

      console.log(
        '[PitchDetection] Requesting microphone with constraints:',
        constraints
      );

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log(
        '[PitchDetection] Got media stream:',
        stream.getTracks().map((t) => ({ kind: t.kind, label: t.label }))
      );

      if (!isMountedRef.current) {
        console.log('[PitchDetection] Component unmounted, stopping stream');
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Resume audio context if suspended (required by browser policies)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('[PitchDetection] Audio context resumed');
      }

      console.log(
        '[PitchDetection] Created audio context, sample rate:',
        audioContext.sampleRate,
        'state:',
        audioContext.state
      );
      audioContextRef.current = audioContext;

      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 2048;
      console.log(
        '[PitchDetection] Created analyser, FFT size:',
        analyserRef.current.fftSize
      );

      sourceRef.current = audioContext.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      console.log('[PitchDetection] Connected audio source to analyser');

      const buffer = new Float32Array(analyserRef.current.fftSize);

      // Create a PitchDetector instance
      const detector = PitchDetector.forFloat32Array(
        analyserRef.current.fftSize
      );
      console.log('[PitchDetection] Created pitchy detector');

      let frameCount = 0;

      const update = () => {
        if (
          !isMountedRef.current ||
          !isActiveRef.current ||
          !analyserRef.current
        ) {
          console.log('[PitchDetection] Update loop stopping:', {
            mounted: isMountedRef.current,
            active: isActiveRef.current,
            hasAnalyser: !!analyserRef.current,
          });
          return;
        }

        try {
          analyserRef.current.getFloatTimeDomainData(buffer);
          frameCount++;

          // Log audio data every 60 frames (roughly every 1 second)
          if (frameCount % 60 === 0) {
            const rms = Math.sqrt(
              buffer.reduce((sum, val) => sum + val * val, 0) / buffer.length
            );
            console.log(
              '[PitchDetection] Audio data check - Frame:',
              frameCount,
              'RMS:',
              rms.toFixed(4)
            );
          }

          const [pitch, clarity] = detector.findPitch(
            buffer,
            audioContext.sampleRate
          );

          // Log pitch detection results (reduced frequency)
          if (pitch > 50 || frameCount % 60 === 0) {
            // Only log when pitch detected or every 60 frames
            console.log('[PitchDetection] Pitchy result:', {
              pitch: pitch > 0 ? pitch.toFixed(2) : 'none',
              clarity: clarity.toFixed(3),
              frame: frameCount,
            });
          }

          if (isMountedRef.current && isActiveRef.current) {
            // Validate frequency range (human hearing: ~20Hz to 20kHz, instruments typically 80Hz to 4kHz)
            if (pitch > 50 && pitch < 5000 && clarity > 0.3) {
              // More reasonable range and threshold
              const noteInfo = frequencyToNoteRef.current(pitch);
              const newResult = {
                frequency: pitch,
                clarity,
                ...noteInfo,
              };

              console.log('[PitchDetection] 🎵 PITCH DETECTED:', newResult);
              setResult(newResult);
            } else {
              setResult((prev) => ({
                ...prev,
                frequency: null,
                clarity: Math.max(0, clarity),
              }));
            }
          }
        } catch (error) {
          console.error('[PitchDetection] Error in update loop:', error);
        }

        // Use requestAnimationFrame with consistent timing (roughly 30fps for audio processing)
        rafRef.current = window.requestAnimationFrame(() => {
          setTimeout(update, 33); // ~30fps instead of 20fps for better responsiveness
        });
      };

      setIsActive(true);
      isActiveRef.current = true;
      console.log('[PitchDetection] Starting update loop...');
      update();
    } catch (error) {
      console.error('[PitchDetection] Failed to setup pitch detection:', error);
      setIsActive(false);
      isActiveRef.current = false;
    }
  }, [deviceId]); // Removed isActive from dependencies as we use ref; frequencyToNote is accessed via ref

  // Stop pitch detection
  const stop = useCallback(() => {
    console.log('[PitchDetection] Stopping pitch detection...');
    setIsActive(false);
    isActiveRef.current = false;

    // Clean up RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
      console.log('[PitchDetection] Cancelled animation frame');
    }

    // Clean up audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      console.log('[PitchDetection] Stopped media stream');
    }

    // Clean up audio source
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
      console.log('[PitchDetection] Disconnected audio source');
    }

    // Clean up audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
        console.log('[PitchDetection] Closed audio context');
      } catch (error) {
        console.warn('[PitchDetection] Error closing audio context:', error);
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    setResult({
      frequency: null,
      clarity: 0,
      note: '',
      octave: 0,
      cents: 0,
    });
    console.log('[PitchDetection] Reset result state');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      isActiveRef.current = false;
      stop();
    };
  }, [stop]);

  return {
    ...result,
    isActive,
    start,
    stop,
  };
}
