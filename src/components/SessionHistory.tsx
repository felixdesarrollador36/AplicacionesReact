import * as React from 'react';
import { useState } from 'react';
import { useSessionStore } from '../store/recording';
import { formatFileSize, formatDuration } from '../utils/formatting';
import { Trash2, Play, RefreshCw } from 'lucide-react';
import { RecordingSession } from '../types/recording';

export const SessionHistory: React.FC = () => {
  const { sessions, removeSession, loadSessions } = useSessionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [conversionProgress, setConversionProgress] = useState(0);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadSessions();
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [loadSessions]);

  const handlePlay = async (session: RecordingSession) => {
    try {
      if (!window.electronAPI) {
        alert('Electron API not available');
        return;
      }
      await window.electronAPI.openFile(session.filepath);
    } catch (error) {
      alert('Failed to open file');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return;
    try {
      if (!window.electronAPI) {
        alert('Electron API not available');
        return;
      }
      await window.electronAPI.deleteSession(id);
      removeSession(id);
    } catch (error) {
      alert(`Failed to delete recording: ${(error as Error).message}`);
    }
  };

  const handleConvert = async (session: RecordingSession) => {
    if (!window.electronAPI) {
      alert('Electron API not available');
      return;
    }

    setConvertingId(session.id);
    setConversionProgress(0);

    // Setup event listeners
    const cleanupProgress = window.electronAPI.onConversionProgress((data) => {
      setConversionProgress(data.percent);
    });

    const cleanupComplete = window.electronAPI.onConversionComplete(async (data) => {
      setConvertingId(null);
      setConversionProgress(0);
      cleanupProgress();
      cleanupComplete();
      cleanupError();
      
      alert(`Conversión completada!\n\nArchivo MP4: ${data.mp4Path}`);
      await loadSessions(); // Recargar la lista
    });

    const cleanupError = window.electronAPI.onConversionError((error) => {
      setConvertingId(null);
      setConversionProgress(0);
      cleanupProgress();
      cleanupComplete();
      cleanupError();
      alert(`Error en conversión: ${error}`);
    });

    try {
      await window.electronAPI.convertToMp4(session.filepath);
    } catch (error) {
      setConvertingId(null);
      setConversionProgress(0);
      cleanupProgress();
      cleanupComplete();
      cleanupError();
      alert(`Error al iniciar conversión: ${(error as Error).message}`);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recordings yet. Start by clicking the record button!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-4">Recording History</h3>
      {sessions.map((session) => (
        <div
          key={session.id}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex-1">
            <p className="font-medium">{session.filename}</p>
            <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
              {session.duration !== undefined && (
                <span>{formatDuration(Math.floor(session.duration / 1000))}</span>
              )}
              {session.size !== undefined && <span>{formatFileSize(session.size)}</span>}
              <span>{new Date(session.startTime).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePlay(session)}
              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Play recording"
            >
              <Play className="w-5 h-5" />
            </button>
            {session.filepath.endsWith('.webm') && (
              <button
                onClick={() => handleConvert(session)}
                disabled={convertingId === session.id}
                className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title={convertingId === session.id ? `Convirtiendo... ${Math.round(conversionProgress)}%` : "Convertir a MP4"}
              >
                <RefreshCw className={`w-5 h-5 ${convertingId === session.id ? 'animate-spin' : ''}`} />
                {convertingId === session.id && (
                  <span className="text-xs">{Math.round(conversionProgress)}%</span>
                )}
              </button>
            )}
            <button
              onClick={() => handleDelete(session.id)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Delete recording"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
