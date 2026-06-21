import * as React from 'react';
import { useRecordingStore } from '../store/recording';
import { formatDuration } from '../utils/formatting';
import { Circle, Pause, Play, Square } from 'lucide-react';

interface RecordingControlsProps {
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  cameraEnabled?: boolean;
  onToggleCamera?: (enabled: boolean) => void;
  isLoading?: boolean;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  onStart,
  onPause,
  onResume,
  onStop,
  cameraEnabled = false,
  onToggleCamera,
  isLoading = false,
}: RecordingControlsProps) => {
  const { isRecording, isPaused, duration } = useRecordingStore();

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {/* Recording Indicator */}
      <div className="flex items-center gap-3">
        {isRecording && (
          <Circle className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
        )}
        <span className="text-sm font-medium">
          {isRecording ? 'Recording...' : 'Ready to record'}
        </span>
      </div>

      {/* Duration Display */}
      <div className="text-5xl font-mono font-bold text-gray-900 dark:text-white">
        {formatDuration(duration)}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4">
        {!isRecording ? (
          <button
            onClick={onStart}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <Circle className="w-5 h-5" />
            Start
          </button>
        ) : (
          <>
            {!isPaused ? (
              <button
                onClick={onPause}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
            ) : (
              <button
                onClick={onResume}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                <Play className="w-5 h-5" />
                Resume
              </button>
            )}
            <button
              onClick={onStop}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              <Square className="w-5 h-5" />
              Stop
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 text-sm">
        <input
          id="camera-overlay"
          type="checkbox"
          checked={cameraEnabled}
          onChange={(event) => onToggleCamera?.(event.target.checked)}
          disabled={isRecording || isLoading}
          className="w-4 h-4"
        />
        <label htmlFor="camera-overlay" className="text-gray-700 dark:text-gray-300">
          Activar camara integrada (modo YouTube)
        </label>
      </div>
    </div>
  );
};
