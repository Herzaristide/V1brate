import { PitchDetector } from 'pitchy';
import { useEffect, useRef, useState } from 'react';

export function usePitchDetection() {
  const [freq, setFreq] = useState<number | null>(null);
  const [clarity, setClarity] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function setup() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
        if (!isMounted) {
          // Component unmounted before setup completed
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 2048;

        sourceRef.current = audioContext.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);

        const buffer = new Float32Array(analyserRef.current.fftSize);

        // Create a PitchDetector instance
        const detector = PitchDetector.forFloat32Array(
          analyserRef.current.fftSize
        );

        const update = () => {
          if (!isMounted || !analyserRef.current) return;

          try {
            analyserRef.current.getFloatTimeDomainData(buffer);
            const [pitch, clarity] = detector.findPitch(
              buffer,
              audioContext.sampleRate
            );

            if (isMounted) {
              setFreq(pitch);
              setClarity(clarity);
            }
          } catch (error) {
            console.warn('Pitch detection error:', error);
          }

          // Use requestAnimationFrame with throttling (roughly 20fps for audio processing)
          rafRef.current = window.requestAnimationFrame(() => {
            setTimeout(update, 50);
          });
        };
        update();
      } catch (error) {
        console.error('Failed to setup pitch detection:', error);
      }
    }

    setup();

    return () => {
      isMounted = false;

      // Clean up RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Clean up audio stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Clean up audio source
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      analyserRef.current = null;
    };
  }, []);

  return { freq, clarity, analyserRef };
}
