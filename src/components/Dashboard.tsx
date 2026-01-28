import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { RecordingControls } from './RecordingControls';
import { SessionHistory } from './SessionHistory';
import { SettingsPanel } from './SettingsPanel';
import { ConversionProgress } from './ConversionProgress';
import { useRecordingStore, useSettingsStore } from '../store/recording';
import { Settings as SettingsIcon, Mic } from 'lucide-react';
import { AudioSetup } from './AudioSetup';
import { useScreenRecorder } from '../hooks/useScreenRecorder';

export const Dashboard: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [audioSetupOpen, setAudioSetupOpen] = React.useState(false);
  const [isConverting, setIsConverting] = React.useState(false);
  const [conversionProgress, setConversionProgress] = React.useState(0);
  const { setRecording, setPaused, setDuration, setError } = useRecordingStore();
  const { settings } = useSettingsStore();
  const screenRecorder = useScreenRecorder();

  // Aplicar tema al documento
  React.useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  React.useEffect(() => {
    // Verificar que electronAPI está disponible
    if (!window.electronAPI) {
      console.warn('electronAPI not available yet');
      return;
    }

    // Setup event listeners for recording updates
    const cleanupTick = window.electronAPI.onRecordingTick((duration) => {
      setDuration(Math.floor(duration));
    });

    const cleanupError = window.electronAPI.onRecordingError((error) => {
      setError(error);
      setRecording(false);
      setPaused(false);
      alert(`Recording Error: ${error}`);
    });

    const cleanupComplete = window.electronAPI.onRecordingComplete(async () => {
      setRecording(false);
      setPaused(false);
      setDuration(0);
      // No convertir automáticamente - el usuario decidirá desde SessionHistory
    });

    const cleanupConversionProgress = window.electronAPI.onConversionProgress((data) => {
      setConversionProgress(data.percent);
    });

    const cleanupConversionComplete = window.electronAPI.onConversionComplete(async (data) => {
      setIsConverting(false);
      setConversionProgress(0);
      const openFolder = window.confirm(
        `Conversion to MP4 complete!\n\n` +
        `File saved: ${data.mp4Path}\n\n` +
        `Would you like to open the recordings folder?`
      );
      
      if (openFolder) {
        const folderPath = data.mp4Path.substring(0, data.mp4Path.lastIndexOf('\\'));
        await window.electronAPI.openFile(folderPath);
      }
    });

    const cleanupConversionError = window.electronAPI.onConversionError((data) => {
      setIsConverting(false);
      setConversionProgress(0);
      alert(`❌ Conversion error: ${data.error}\nThe WebM file has been saved.`);
    });

    // Cleanup listeners on unmount
    return () => {
      cleanupTick();
      cleanupError();
      cleanupComplete();
      cleanupConversionProgress();
      cleanupConversionComplete();
      cleanupConversionError();
    };
  }, [setRecording, setPaused, setDuration, setError]);

  const handleStart = async () => {
    try {
      if (!window.electronAPI) {
        setError('Electron API not available');
        return;
      }

      // Get display sources first
      const sources = await window.electronAPI.getDisplaySources();
      if (sources.length === 0) {
        setError('No display sources available');
        return;
      }

      // Use the first screen source
      const screenSource = sources.find(s => s.type === 'screen') || sources[0];

      // Start recording in main process
      await window.electronAPI.startRecording({
        outputPath: settings.outputPath || settings.defaultOutputPath,
        audioSource: settings.audioSource,
        videoQuality: settings.videoQuality,
        audioQuality: settings.audioQuality,
        format: 'webm',
      });

      // Start screen capture in renderer
      await screenRecorder.startRecording(screenSource.id);
      
      setRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      setError((error as Error).message);
      setRecording(false);
    }
  };

  const handlePause = async () => {
    try {
      if (!window.electronAPI) {
        setError('Electron API not available');
        return;
      }
      screenRecorder.pauseRecording();
      await window.electronAPI.pauseRecording();
      setPaused(true);
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleResume = async () => {
    try {
      if (!window.electronAPI) {
        setError('Electron API not available');
        return;
      }
      screenRecorder.resumeRecording();
      await window.electronAPI.resumeRecording();
      setPaused(false);
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleStop = async () => {
    try {
      if (!window.electronAPI) {
        setError('Electron API not available');
        return;
      }
      
      // Stop screen capture first
      await screenRecorder.stopRecording();
      
      // Then stop recording in main process
      await window.electronAPI.stopRecording();
      
      setRecording(false);
      setPaused(false);
      setDuration(0);
    } catch (error) {
      console.error('Stop error:', error);
      setError((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Screen Recorder</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setAudioSetupOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Audio Setup"
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="recorder" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recorder">Recorder</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="recorder" className="mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <RecordingControls
                onStart={handleStart}
                onPause={handlePause}
                onResume={handleResume}
                onStop={handleStop}
              />
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <SessionHistory />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {audioSetupOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-96 p-6">
            <AudioSetup onComplete={() => setAudioSetupOpen(false)} />
          </div>
        </div>
      )}

      {/* Conversion Progress */}
      <ConversionProgress isVisible={isConverting} progress={conversionProgress} />
    </div>
  );
};
