'use client';

import { useMetronome } from '../../../contexts/MetronomeContext';

export default function MetronomeWidget() {
  const {
    bpm,
    setBpm,
    isPlaying,
    setIsPlaying,
    timeSignature,
    setTimeSignature,
    currentBeat
  } = useMetronome();

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(e.target.value, 10);
    if (newBpm <= 300 && newBpm > 0) {
      setBpm(newBpm);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-white">
      {/* BPM Display */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold mb-2">{bpm} BPM</div>
        <input
          type="range"
          min="30"
          max="300"
          value={bpm}
          onChange={handleBpmChange}
          className="w-full max-w-48 accent-blue-500"
          aria-label="BPM slider"
          title="Adjust BPM (beats per minute)"
        />
      </div>

      {/* Time Signature */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm">Time Signature:</label>
        <select
          value={timeSignature}
          onChange={(e) => setTimeSignature(parseInt(e.target.value))}
          className="bg-white/20 text-white border border-white/30 rounded px-2 py-1"
          aria-label="Time signature selection"
          title="Select time signature"
        >
          <option value={2}>2/4</option>
          <option value={3}>3/4</option>
          <option value={4}>4/4</option>
          <option value={6}>6/8</option>
        </select>
      </div>

      {/* Beat Indicator */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: timeSignature }, (_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-100 ${
              i + 1 === currentBeat
                ? i === 0
                  ? 'bg-red-400 border-red-400'
                  : 'bg-blue-400 border-blue-400'
                : 'border-white/50'
            }`}
          />
        ))}
      </div>

      {/* Play/Stop Button */}
      <button
        onClick={togglePlay}
        className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
          isPlaying
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {isPlaying ? 'Stop' : 'Start'}
      </button>

      {/* BPM Input */}
      <div className="mt-4">
        <input
          type="number"
          min="30"
          max="300"
          value={bpm}
          onChange={handleBpmChange}
          className="bg-white/20 text-white border border-white/30 rounded px-3 py-1 text-center w-20"
          aria-label="BPM input"
          title="Enter BPM value"
        />
      </div>
    </div>
  );
}
