import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Download,
  Upload,
  Settings,
} from 'lucide-react';
import { NotationSystem, MusicalKey } from '../../types';

interface RecordingWidgetProps {
  selectedMicrophone?: string;
  settings?: Record<string, any>;
  updateSetting?: (key: string, value: any) => void;
  preferredKey?: MusicalKey;
  notationSystem?: NotationSystem;
}

interface Recording {
  id: string;
  blob: Blob;
  name: string;
  duration: number;
  timestamp: number;
}

const RecordingWidget: React.FC<RecordingWidgetProps> = ({
  selectedMicrophone,
  settings = {},
  updateSetting,
  preferredKey = 'C',
  notationSystem = 'ABC',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [audioQuality, setAudioQuality] = useState<'low' | 'medium' | 'high'>(
    settings.recordingQuality || 'medium'
  );
  const [autoSave, setAutoSave] = useState(settings.recordingAutoSave || false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  // Update settings when they change
  useEffect(() => {
    if (updateSetting) {
      updateSetting('recordingQuality', audioQuality);
      updateSetting('recordingAutoSave', autoSave);
    }
  }, [audioQuality, autoSave, updateSetting]);

  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio quality settings
  const getAudioConstraints = (quality: string) => {
    switch (quality) {
      case 'low':
        return { sampleRate: 22050, bitRate: 64000 };
      case 'high':
        return { sampleRate: 48000, bitRate: 192000 };
      default:
        return { sampleRate: 44100, bitRate: 128000 };
    }
  };

  const startRecording = async () => {
    try {
      const constraints = getAudioConstraints(audioQuality);
      const audioConstraints: any = {
        sampleRate: constraints.sampleRate,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };

      // Add specific microphone if selected
      if (selectedMicrophone) {
        audioConstraints.deviceId = { exact: selectedMicrophone };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: constraints.bitRate,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const newRecording: Recording = {
          id: Date.now().toString(),
          blob,
          name: `Recording ${new Date().toLocaleTimeString()}`,
          duration: recordingTime,
          timestamp: Date.now(),
        };

        setRecordings((prev) => [newRecording, ...prev]);
        setCurrentRecording(newRecording);

        if (autoSave) {
          uploadRecording(newRecording);
        }

        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const playRecording = (recording: Recording) => {
    if (audioRef.current) {
      const url = URL.createObjectURL(recording.blob);
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
      setCurrentRecording(recording);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const downloadRecording = (recording: Recording) => {
    const url = URL.createObjectURL(recording.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.name}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const uploadRecording = async (recording: Recording) => {
    try {
      // For now, just download the file since we don't have the recording service
      // In the future, this could upload to a server
      downloadRecording(recording);
      console.log('Recording saved locally:', recording.name);
    } catch (error) {
      console.error('Failed to save recording:', error);
    }
  };

  const deleteRecording = (recordingId: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
    if (currentRecording?.id === recordingId) {
      setCurrentRecording(null);
      stopPlayback();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className='h-full flex flex-col'>
      {/* Controls */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center space-x-2'>
          {!isRecording ? (
            <button
              onClick={startRecording}
              className='p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors'
            >
              <Mic className='h-5 w-5' />
            </button>
          ) : (
            <div className='flex items-center space-x-2'>
              <button
                onClick={stopRecording}
                className='p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors'
              >
                <Square className='h-5 w-5' />
              </button>

              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className='p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors'
              >
                {isPaused ? (
                  <Play className='h-5 w-5' />
                ) : (
                  <Pause className='h-5 w-5' />
                )}
              </button>
            </div>
          )}
        </div>

        <div className='flex items-center space-x-2'>
          {isRecording && (
            <div className='flex items-center space-x-2 text-red-600'>
              <div className='w-2 h-2 bg-red-600 rounded-full animate-pulse' />
              <span className='text-sm font-mono'>
                {formatTime(recordingTime)}
              </span>
              {isPaused && <span className='text-xs'>(Paused)</span>}
            </div>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
          >
            <Settings className='h-4 w-4' />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className='mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'>
          <div className='space-y-3'>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Audio Quality
              </label>
              <select
                value={audioQuality}
                onChange={(e) => setAudioQuality(e.target.value as any)}
                className='w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700'
              >
                <option value='low'>Low (22kHz, 64kbps)</option>
                <option value='medium'>Medium (44kHz, 128kbps)</option>
                <option value='high'>High (48kHz, 192kbps)</option>
              </select>
            </div>

            <div className='flex items-center'>
              <input
                type='checkbox'
                id='autoSave'
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className='mr-2'
              />
              <label
                htmlFor='autoSave'
                className='text-sm text-gray-700 dark:text-gray-300'
              >
                Auto-upload recordings
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Current Recording Status */}
      {currentRecording && (
        <div className='mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='font-medium text-gray-900 dark:text-white'>
                {currentRecording.name}
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-300'>
                Duration: {formatTime(currentRecording.duration)}
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              <button
                onClick={() => playRecording(currentRecording)}
                disabled={isPlaying}
                className='p-1 bg-green-100 text-green-600 hover:bg-green-200 rounded disabled:opacity-50'
              >
                <Play className='h-4 w-4' />
              </button>

              <button
                onClick={() => downloadRecording(currentRecording)}
                className='p-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded'
              >
                <Download className='h-4 w-4' />
              </button>

              <button
                onClick={() => uploadRecording(currentRecording)}
                className='p-1 bg-purple-100 text-purple-600 hover:bg-purple-200 rounded'
              >
                <Upload className='h-4 w-4' />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recordings List */}
      <div className='flex-1 overflow-hidden'>
        <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-2'>
          Recent Recordings ({recordings.length})
        </h4>

        <div className='h-full overflow-y-auto space-y-2'>
          {recordings.length === 0 ? (
            <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
              <Mic className='h-8 w-8 mx-auto mb-2 opacity-50' />
              <p className='text-sm'>No recordings yet</p>
              <p className='text-xs'>Click the microphone to start</p>
            </div>
          ) : (
            recordings.map((recording) => (
              <div
                key={recording.id}
                className='p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex-1 min-w-0'>
                    <div className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                      {recording.name}
                    </div>
                    <div className='text-xs text-gray-600 dark:text-gray-300'>
                      {formatTime(recording.duration)} •{' '}
                      {new Date(recording.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className='flex items-center space-x-1 ml-2'>
                    <button
                      onClick={() => playRecording(recording)}
                      className='p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded'
                      title='Play'
                    >
                      <Play className='h-3 w-3' />
                    </button>

                    <button
                      onClick={() => downloadRecording(recording)}
                      className='p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded'
                      title='Download'
                    >
                      <Download className='h-3 w-3' />
                    </button>

                    <button
                      onClick={() => deleteRecording(recording.id)}
                      className='p-1 hover:bg-red-100 hover:text-red-600 rounded'
                      title='Delete'
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Hidden audio element for playback */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        className='hidden'
      />
    </div>
  );
};

export default RecordingWidget;
