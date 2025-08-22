import { PitchPoint } from '../types';

// Pitch detection using autocorrelation
export class PitchDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Float32Array | null = null;
  private isDetecting = false;

  constructor(private sampleRate: number = 44100) {}

  async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.sampleRate,
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();

      this.analyser.fftSize = 4096;
      this.analyser.smoothingTimeConstant = 0;

      this.microphone.connect(this.analyser);
      this.dataArray = new Float32Array(this.analyser.fftSize);
    } catch (error) {
      throw new Error('Failed to initialize audio: ' + error);
    }
  }

  startDetection(
    callback: (frequency: number) => void,
    interval: number = 100
  ): void {
    if (!this.analyser || !this.dataArray || this.isDetecting) return;

    this.isDetecting = true;

    const detect = () => {
      if (!this.isDetecting) return;

      this.analyser!.getFloatTimeDomainData(this.dataArray!);
      const frequency = this.detectPitch(this.dataArray!);

      if (frequency > 0) {
        callback(frequency);
      }

      setTimeout(detect, interval);
    };

    detect();
  }

  stopDetection(): void {
    this.isDetecting = false;
  }

  private detectPitch(buffer: Float32Array): number {
    // Autocorrelation-based pitch detection
    const size = buffer.length;
    const maxSamples = Math.floor(size / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;

    // Calculate RMS to check if there's enough signal
    for (let i = 0; i < size; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / size);

    // If signal is too weak, return 0
    if (rms < 0.01) return 0;

    // Autocorrelation
    for (let offset = 1; offset < maxSamples; offset++) {
      let correlation = 0;

      for (let i = 0; i < maxSamples; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }

      correlation = 1 - correlation / maxSamples;

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    // Convert offset to frequency
    if (bestOffset === -1 || bestCorrelation < 0.3) return 0;

    return this.sampleRate / bestOffset;
  }

  async destroy(): Promise<void> {
    this.stopDetection();

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Pitch buffer management
export class PitchBuffer {
  private buffer: PitchPoint[] = [];
  private maxSize: number;

  constructor(maxSize: number = 250) {
    this.maxSize = maxSize;
  }

  add(pitchPoint: PitchPoint): void {
    this.buffer.push(pitchPoint);

    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getBuffer(): PitchPoint[] {
    return [...this.buffer];
  }

  getRecentNotes(count: number): PitchPoint[] {
    return this.buffer.slice(-count);
  }

  clear(): void {
    this.buffer = [];
  }

  setMaxSize(size: number): void {
    this.maxSize = size;

    if (this.buffer.length > size) {
      this.buffer = this.buffer.slice(-size);
    }
  }

  getSize(): number {
    return this.buffer.length;
  }

  isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  // Export buffer as JSON
  export(): any {
    return {
      notes: this.buffer,
      maxSize: this.maxSize,
      timestamp: Date.now(),
    };
  }

  // Import buffer from JSON
  import(data: any): void {
    if (data.notes && Array.isArray(data.notes)) {
      this.buffer = data.notes;
      if (data.maxSize) {
        this.maxSize = data.maxSize;
      }
    }
  }
}
