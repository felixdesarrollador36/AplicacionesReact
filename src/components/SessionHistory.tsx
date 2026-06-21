import * as React from 'react';
import { useState } from 'react';
import { useSessionStore } from '../store/recording';
import { formatFileSize, formatDuration } from '../utils/formatting';
import { Trash2, Play, RefreshCw, FileText } from 'lucide-react';
import { RecordingSession } from '../types/recording';
import { ConversionCompleteEvent, ConversionErrorEvent, ConversionProgressEvent, TranscriptionCompleteEvent, TranscriptionErrorEvent, TranscriptionProgressEvent } from '../types/electron';

export const SessionHistory: React.FC = () => {
  const { sessions, removeSession, loadSessions } = useSessionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTaskKey, setActiveTaskKey] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState(0);

  const getConversionKey = (sessionId: string, targetFormat: 'mp4' | 'mp3') => `${sessionId}:${targetFormat}`;
  const getTranscriptionKey = (sessionId: string) => `${sessionId}:transcript`;

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

  const handleConvert = async (session: RecordingSession, targetFormat: 'mp4' | 'mp3') => {
    if (!window.electronAPI) {
      alert('Electron API not available');
      return;
    }

    const conversionKey = getConversionKey(session.id, targetFormat);
    setActiveTaskKey(conversionKey);
    setTaskProgress(0);

    const cleanupProgress = window.electronAPI.onConversionProgress((data: ConversionProgressEvent) => {
      if (data.targetFormat !== targetFormat) {
        return;
      }

      setTaskProgress(data.percent);
    });

    const cleanupComplete = window.electronAPI.onConversionComplete(async (data: ConversionCompleteEvent) => {
      if (data.targetFormat !== targetFormat) {
        return;
      }

      setActiveTaskKey(null);
      setTaskProgress(0);
      cleanupProgress();
      cleanupComplete();
      cleanupError();

      alert(`Conversión completada!\n\nArchivo ${data.targetFormat.toUpperCase()}: ${data.outputPath}`);
      await loadSessions();
    });

    const cleanupError = window.electronAPI.onConversionError((data: ConversionErrorEvent) => {
      if (data.targetFormat !== targetFormat) {
        return;
      }

      setActiveTaskKey(null);
      setTaskProgress(0);
      cleanupProgress();
      cleanupComplete();
      cleanupError();
      alert(`Error en conversión: ${data.error}`);
    });

    try {
      if (targetFormat === 'mp4') {
        await window.electronAPI.convertToMp4(session.filepath);
      } else {
        await window.electronAPI.convertToMp3(session.filepath);
      }
    } catch (error) {
      setActiveTaskKey(null);
      setTaskProgress(0);
      cleanupProgress();
      cleanupComplete();
      cleanupError();
      alert(`Error al iniciar conversión: ${(error as Error).message}`);
    }
  };

  const handleTranscribe = async (session: RecordingSession) => {
    if (!window.electronAPI) {
      alert('Electron API not available');
      return;
    }

    const transcriptionKey = getTranscriptionKey(session.id);
    setActiveTaskKey(transcriptionKey);
    setTaskProgress(0);

    const cleanupProgress = window.electronAPI.onTranscriptionProgress((data: TranscriptionProgressEvent) => {
      if (data.inputPath !== session.filepath) {
        return;
      }

      setTaskProgress(data.percent);
    });

    const cleanupComplete = window.electronAPI.onTranscriptionComplete((data: TranscriptionCompleteEvent) => {
      if (data.inputPath !== session.filepath) {
        return;
      }

      setActiveTaskKey(null);
      setTaskProgress(0);
      cleanupProgress();
      cleanupComplete();
      cleanupError();

      const subtitleLine = data.subtitlePath ? `\nSubtítulos SRT: ${data.subtitlePath}` : '';
      alert(`Transcripción completada!\n\nTexto: ${data.transcriptPath}${subtitleLine}`);
    });

    const cleanupError = window.electronAPI.onTranscriptionError((data: TranscriptionErrorEvent) => {
      if (data.inputPath !== session.filepath) {
        return;
      }

      setActiveTaskKey(null);
      setTaskProgress(0);
      cleanupProgress();
      cleanupComplete();
      cleanupError();
      alert(`Error en transcripción: ${data.error}`);
    });

    try {
      await window.electronAPI.transcribeRecording(session.filepath);
    } catch (error) {
      setActiveTaskKey(null);
      setTaskProgress(0);
      cleanupProgress();
      cleanupComplete();
      cleanupError();
      alert(`Error al iniciar transcripción: ${(error as Error).message}`);
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
          className="flex items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
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
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => handlePlay(session)}
              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Play recording"
            >
              <Play className="w-5 h-5" />
            </button>
            {session.filepath.endsWith('.webm') && (
              <button
                onClick={() => handleConvert(session, 'mp4')}
                disabled={activeTaskKey === getConversionKey(session.id, 'mp4')}
                className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title={activeTaskKey === getConversionKey(session.id, 'mp4') ? `Convirtiendo... ${Math.round(taskProgress)}%` : 'Convertir a MP4'}
                aria-label="Convertir a MP4"
              >
                <RefreshCw className={`w-5 h-5 ${activeTaskKey === getConversionKey(session.id, 'mp4') ? 'animate-spin' : ''}`} />
                <span className="text-xs font-semibold">MP4</span>
                {activeTaskKey === getConversionKey(session.id, 'mp4') && (
                  <span className="text-xs">{Math.round(taskProgress)}%</span>
                )}
              </button>
            )}
            {!session.filepath.endsWith('.mp3') && (
              <button
                onClick={() => handleConvert(session, 'mp3')}
                disabled={activeTaskKey === getConversionKey(session.id, 'mp3')}
                className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title={activeTaskKey === getConversionKey(session.id, 'mp3') ? `Extrayendo audio... ${Math.round(taskProgress)}%` : 'Extraer audio a MP3'}
                aria-label="Convertir a MP3"
              >
                <RefreshCw className={`w-5 h-5 ${activeTaskKey === getConversionKey(session.id, 'mp3') ? 'animate-spin' : ''}`} />
                <span className="text-xs font-semibold">MP3</span>
                {activeTaskKey === getConversionKey(session.id, 'mp3') && (
                  <span className="text-xs">{Math.round(taskProgress)}%</span>
                )}
              </button>
            )}
            <button
              onClick={() => handleTranscribe(session)}
              disabled={activeTaskKey === getTranscriptionKey(session.id)}
              className="p-2 text-violet-600 hover:bg-violet-50 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title={activeTaskKey === getTranscriptionKey(session.id) ? `Transcribiendo... ${Math.round(taskProgress)}%` : 'Generar transcripción y subtítulos'}
              aria-label="Transcribir grabación"
            >
              <FileText className={`w-5 h-5 ${activeTaskKey === getTranscriptionKey(session.id) ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-semibold">TXT/SRT</span>
              {activeTaskKey === getTranscriptionKey(session.id) && (
                <span className="text-xs">{Math.round(taskProgress)}%</span>
              )}
            </button>
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
