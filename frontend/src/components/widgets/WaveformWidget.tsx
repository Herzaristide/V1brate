'use client';

import { usePitchDetection } from '../../hooks/usePitchDetection';
import { useEffect, useState, useRef, useCallback } from 'react';

interface WaveformWidgetProps {
  selectedMicrophone?: string;
  settings?: Record<string, any>;
  updateSetting?: (key: string, value: any) => void;
}

const WaveformWidget: React.FC<WaveformWidgetProps> = ({
  selectedMicrophone,
  settings = {},
  updateSetting,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const amplitudeHistoryRef = useRef<number[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const { isActive, start, stop } = usePitchDetection(selectedMicrophone);

  const [isRunning, setIsRunning] = useState(false);
  const [sensitivity, setSensitivity] = useState(
    settings.waveformSensitivity || 50
  );
  const [waveformColor, setWaveformColor] = useState(
    settings.waveformColor || '#4ade80'
  );
  const [backgroundColor] = useState(settings.waveformBgColor || '#1f2937');
  const [maxHistory, setMaxHistory] = useState(
    settings.waveformMaxHistory || 400
  );
  const [currentAmplitude, setCurrentAmplitude] = useState(0);

  // Update settings when they change
  useEffect(() => {
    if (updateSetting) {
      updateSetting('waveformSensitivity', sensitivity);
      updateSetting('waveformColor', waveformColor);
      updateSetting('waveformBgColor', backgroundColor);
      updateSetting('waveformMaxHistory', maxHistory);
    }
  }, [sensitivity, waveformColor, backgroundColor, maxHistory, updateSetting]);

  // Get audio analyser from pitch detection
  useEffect(() => {
    if (isActive && isRunning) {
      // We need to access the analyser from the pitch detection hook
      // This is a simplified approach - in a real implementation,
      // you might want to expose the analyser from the hook
      const getAnalyser = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: selectedMicrophone
              ? { deviceId: { exact: selectedMicrophone } }
              : true,
          });

          const audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;

          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);

          analyserRef.current = analyser;
        } catch (error) {
          console.error('Failed to get audio analyser:', error);
        }
      };

      getAnalyser();
    } else {
      analyserRef.current = null;
    }
  }, [isActive, isRunning, selectedMicrophone]);

  // Update amplitude history
  useEffect(() => {
    let animationId: number;

    const updateAmplitude = () => {
      if (!analyserRef.current || !isRunning) {
        animationId = requestAnimationFrame(updateAmplitude);
        return;
      }

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(dataArray);

      // Calculate RMS (Root Mean Square) for amplitude
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const sample = (dataArray[i] - 128) / 128; // Convert to -1 to 1 range
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const amplitude = rms * (sensitivity / 50); // Apply sensitivity

      setCurrentAmplitude(amplitude);

      // Add to history
      amplitudeHistoryRef.current = [
        ...amplitudeHistoryRef.current,
        amplitude,
      ].slice(-maxHistory);

      // Continue updating
      animationId = requestAnimationFrame(updateAmplitude);
    };

    // Start the update loop
    updateAmplitude();

    // Cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [sensitivity, maxHistory, isRunning]);

  // Draw scrolling waveform
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const history = amplitudeHistoryRef.current;
    const centerY = height / 2;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Amplitude reference lines
    const amplitudeLines = [0.25, 0.5, 0.75, 1.0];
    amplitudeLines.forEach((amp) => {
      const yPos = centerY - amp * centerY * 0.8; // Positive amplitude
      const yNeg = centerY + amp * centerY * 0.8; // Negative amplitude

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(width, yPos);
      ctx.moveTo(0, yNeg);
      ctx.lineTo(width, yNeg);
      ctx.stroke();

      // Labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px monospace';
      ctx.fillText(`+${amp.toFixed(2)}`, 5, yPos - 2);
      ctx.fillText(`-${amp.toFixed(2)}`, 5, yNeg + 12);
    });

    // Vertical grid lines (time)
    for (let i = 0; i < 10; i++) {
      const x = (width / 10) * i;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw waveform if we have history
    if (history.length > 1) {
      ctx.strokeStyle = waveformColor;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const pointSpacing = width / Math.max(history.length - 1, 1);

      for (let i = 0; i < history.length; i++) {
        const amplitude = history[i];
        const x = i * pointSpacing;

        // Center the amplitude around the middle, scale to use 80% of available height
        const y = centerY - amplitude * centerY * 0.8;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Draw current amplitude point
      if (history.length > 0) {
        const currentAmp = history[history.length - 1];
        const x = (history.length - 1) * pointSpacing;
        const y = centerY - currentAmp * centerY * 0.8;

        ctx.fillStyle = waveformColor;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Debug info - always draw a test line if no data
    if (history.length === 0) {
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Debug text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px monospace';
      ctx.fillText('Waiting for audio data...', 10, centerY - 10);
      ctx.fillText(
        `Analyser ready: ${!!analyserRef.current}`,
        10,
        centerY + 20
      );
    }

    // Continue animation
    animationRef.current = requestAnimationFrame(drawWaveform);
  }, [backgroundColor, waveformColor]);

  // Start drawing animation
  useEffect(() => {
    if (isRunning) {
      drawWaveform();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawWaveform, isRunning]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    resizeCanvas();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Clear history function
  const clearHistory = () => {
    amplitudeHistoryRef.current = [];
  };

  // Toggle waveform analysis
  const handleToggle = async () => {
    if (isRunning) {
      setIsRunning(false);
      stop();
    } else {
      try {
        await start();
        setIsRunning(true);
      } catch (error) {
        console.error('Failed to start waveform analysis:', error);
      }
    }
  };

  return (
    <div className='flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden'>
      {/* Header */}
      <div className='p-3 bg-gray-800 border-b border-gray-700'>
        <div className='flex items-center justify-between mb-2'>
          <h3 className='text-white font-medium'>Audio Amplitude Waveform</h3>
          <div className='flex gap-2'>
            <button
              onClick={handleToggle}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isRunning
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isRunning ? 'Stop' : 'Start'}
            </button>
            <button
              onClick={clearHistory}
              className='px-3 py-1 rounded text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white'
            >
              Clear
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className='grid grid-cols-2 gap-4 text-xs'>
          <div className='flex items-center gap-2'>
            <label className='text-gray-300'>Sensitivity:</label>
            <input
              type='range'
              min='10'
              max='200'
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className='flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer'
              aria-label='Waveform sensitivity'
            />
            <span className='text-gray-400 w-8'>{sensitivity}%</span>
          </div>

          <div className='flex items-center gap-2'>
            <label className='text-gray-300'>History:</label>
            <input
              type='range'
              min='100'
              max='1000'
              value={maxHistory}
              onChange={(e) => setMaxHistory(Number(e.target.value))}
              className='flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer'
              aria-label='Waveform history length'
            />
            <span className='text-gray-400 w-12'>{maxHistory}</span>
          </div>

          <div className='flex items-center gap-2 col-span-2'>
            <label className='text-gray-300'>Color:</label>
            <input
              type='color'
              value={waveformColor}
              onChange={(e) => setWaveformColor(e.target.value)}
              className='w-6 h-6 rounded border border-gray-600 cursor-pointer'
              aria-label='Waveform color'
            />
            <div className='text-gray-400 text-xs ml-2'>
              Current Amplitude: {(currentAmplitude * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Waveform Display */}
      <div className='flex-1 relative'>
        <canvas
          ref={canvasRef}
          className='absolute inset-0 w-full h-full'
          style={{ backgroundColor: backgroundColor }}
        />

        {/* Info overlay */}
        <div className='absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white'>
          <div>
            Points: {amplitudeHistoryRef.current.length}/{maxHistory}
          </div>
          <div className='text-xs text-gray-400'>Time flows left → right</div>
          <div className='text-xs text-gray-400'>Amplitude: 0 = center</div>
          <div className='text-xs text-yellow-400'>
            Analyser: {analyserRef.current ? 'Ready' : 'Waiting...'}
          </div>
          <div className='text-xs text-blue-400'>
            Current: {(currentAmplitude * 100).toFixed(1)}%
          </div>
          <div className='text-xs text-green-400'>
            Status: {isRunning ? 'Running' : 'Stopped'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaveformWidget;
