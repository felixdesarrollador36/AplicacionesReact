import * as React from 'react';
import { useState } from 'react';
import { useSettingsStore } from '../store/recording';
import { X, FolderOpen, ExternalLink } from 'lucide-react';
import { AudioSource, VideoQuality, AudioQuality } from '../types/recording';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }: SettingsPanelProps) => {
  const { settings, setSetting, saveSettings } = useSettingsStore();
  const [isSaving, setIsSaving] = useState(false);
  const [defaultRecordingPath, setDefaultRecordingPath] = useState('');
  const effectiveOutputPath = settings.outputPath || settings.defaultOutputPath || defaultRecordingPath;
  const [outputPath, setOutputPath] = useState(effectiveOutputPath);

  React.useEffect(() => {
    if (!window.electronAPI) {
      return;
    }

    window.electronAPI
      .getDefaultRecordingPath()
      .then(setDefaultRecordingPath)
      .catch((error) => {
        console.error('Error loading default recording path:', error);
      });
  }, []);

  // Sincronizar outputPath local si cambia en el store
  React.useEffect(() => {
    setOutputPath(effectiveOutputPath);
  }, [effectiveOutputPath]);

  const handleSelectOutputPath = async () => {
    try {
      const path = await window.electronAPI.selectOutputPath();
      if (path) {
        setOutputPath(path);
        setSetting('outputPath', path);
        // Guardar automáticamente si está activo
        if (settings.autoSavePreferences) {
          await saveSettings();
        }
      }
    } catch (error) {
      console.error('Error selecting output path:', error);
    }
  };

  const handleOpenOutputFolder = async () => {
    try {
      const pathToOpen = effectiveOutputPath || outputPath;
      if (!pathToOpen) {
        return;
      }
      await window.electronAPI.openFile(pathToOpen);
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings();
      alert('Settings saved successfully');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close settings"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Output Path */}
          <div>
            <label htmlFor="output-path" className="block text-sm font-medium mb-2">Save Recordings To</label>
            <div className="space-y-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900/60">
                <div className="font-medium text-gray-900 dark:text-gray-100">Current recording folder</div>
                <div className="mt-1 break-all font-mono text-xs text-gray-600 dark:text-gray-300">
                  {effectiveOutputPath || 'Loading recording path...'}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {settings.outputPath || settings.defaultOutputPath ? 'Using a configured save folder.' : 'Using the application default save folder.'}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  id="output-path"
                  type="text"
                  value={outputPath}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                  placeholder="Default location"
                />
                <button
                  onClick={handleSelectOutputPath}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"
                  title="Change folder"
                >
                  <FolderOpen className="w-5 h-5" />
                </button>
                <button
                  onClick={handleOpenOutputFolder}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                  title="Open recordings folder"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click the folder icon to change where recordings are saved, or the arrow to open the current folder.
              </p>
            </div>
          </div>

          {/* Audio Source */}
          <div>
            <label htmlFor="audio-source" className="block text-sm font-medium mb-2">Audio Source</label>
            <select
              id="audio-source"
              value={settings.audioSource}
              onChange={(e) => setSetting('audioSource', e.target.value as AudioSource)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            >
              <option value="system">System Audio</option>
              <option value="microphone">Microphone</option>
              <option value="both">Both (System + Microphone)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enableCameraOverlay"
              checked={settings.enableCameraOverlay}
              onChange={(e) => setSetting('enableCameraOverlay', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="enableCameraOverlay" className="text-sm font-medium">
              Activar camara integrada (Picture-in-Picture) al iniciar grabacion
            </label>
          </div>

          {/* Video Quality */}
          <div>
            <label htmlFor="video-quality" className="block text-sm font-medium mb-2">Video Quality</label>
            <select
              id="video-quality"
              value={settings.videoQuality}
              onChange={(e) => setSetting('videoQuality', e.target.value as VideoQuality)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            >
              <option value="low">Low (720p @ 24fps)</option>
              <option value="medium">Medium (1080p @ 30fps)</option>
              <option value="high">High (1440p @ 60fps)</option>
            </select>
          </div>

          {/* Audio Quality */}
          <div>
            <label htmlFor="audio-quality" className="block text-sm font-medium mb-2">Audio Quality</label>
            <select
              id="audio-quality"
              value={settings.audioQuality}
              onChange={(e) => setSetting('audioQuality', e.target.value as AudioQuality)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            >
              <option value="low">Low (96 kbps)</option>
              <option value="medium">Medium (128 kbps)</option>
              <option value="high">High (256 kbps)</option>
            </select>
          </div>

          <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <h3 className="text-sm font-semibold">OpenAI Transcription</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Use OpenAI Whisper to generate a transcript and optional SRT subtitles from your recordings.
              </p>
            </div>

            <div>
              <label htmlFor="transcription-base-url" className="block text-sm font-medium mb-2">OpenAI Base URL</label>
              <input
                id="transcription-base-url"
                type="text"
                value={settings.transcriptionApiBaseUrl}
                onChange={(e) => setSetting('transcriptionApiBaseUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                placeholder="https://api.openai.com/v1"
              />
            </div>

            <div>
              <label htmlFor="transcription-api-key" className="block text-sm font-medium mb-2">OpenAI API Key</label>
              <input
                id="transcription-api-key"
                type="password"
                value={settings.transcriptionApiKey}
                onChange={(e) => setSetting('transcriptionApiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                placeholder="sk-..."
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Example: Base URL <span className="font-mono">https://api.openai.com/v1</span> and model <span className="font-mono">whisper-1</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="transcription-model" className="block text-sm font-medium mb-2">Model</label>
                <input
                  id="transcription-model"
                  type="text"
                  value={settings.transcriptionModel}
                  onChange={(e) => setSetting('transcriptionModel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                  placeholder="whisper-1"
                />
              </div>

              <div>
                <label htmlFor="transcription-language" className="block text-sm font-medium mb-2">Language</label>
                <input
                  id="transcription-language"
                  type="text"
                  value={settings.transcriptionLanguage}
                  onChange={(e) => setSetting('transcriptionLanguage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm"
                  placeholder="es"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoTranscribe"
                checked={settings.autoTranscribe}
                onChange={(e) => setSetting('autoTranscribe', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="autoTranscribe" className="text-sm font-medium">
                Transcribe automatically after each recording
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="generateSubtitles"
                checked={settings.generateSubtitles}
                onChange={(e) => setSetting('generateSubtitles', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="generateSubtitles" className="text-sm font-medium">
                Generate SRT subtitles together with the transcript
              </label>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label htmlFor="theme" className="block text-sm font-medium mb-2">Theme</label>
            <select
              id="theme"
              value={settings.theme}
              onChange={async (e) => {
                const newTheme = e.target.value as 'light' | 'dark';
                setSetting('theme', newTheme);
                // Aplicar inmediatamente
                if (newTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                // Guardar automáticamente si está activo
                if (settings.autoSavePreferences) {
                  await saveSettings();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* Auto Save Preferences */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoSave"
              checked={settings.autoSavePreferences}
              onChange={(e) => setSetting('autoSavePreferences', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="autoSave" className="text-sm font-medium">
              Auto-save preferences
            </label>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
