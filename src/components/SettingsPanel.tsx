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
  const [outputPath, setOutputPath] = useState(settings.outputPath || '');

  const handleSelectOutputPath = async () => {
    try {
      const path = await window.electronAPI.selectOutputPath();
      if (path) {
        setOutputPath(path);
        setSetting('outputPath', path);
      }
    } catch (error) {
      console.error('Error selecting output path:', error);
    }
  };

  const handleOpenOutputFolder = async () => {
    try {
      const appDataPath = process.platform === 'win32' 
        ? process.env.APPDATA 
        : process.env.HOME;
      const defaultPath = `${appDataPath}\\sistemagrabacion\\recordings`;
      const pathToOpen = outputPath || defaultPath;
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
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Output Path */}
          <div>
            <label className="block text-sm font-medium mb-2">Save Recordings To</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={outputPath || 'Default Location (AppData\\sistemagrabacion\\recordings)'}
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
            <label className="block text-sm font-medium mb-2">Audio Source</label>
            <select
              value={settings.audioSource}
              onChange={(e) => setSetting('audioSource', e.target.value as AudioSource)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            >
              <option value="system">System Audio</option>
              <option value="microphone">Microphone</option>
              <option value="both">Both (System + Microphone)</option>
            </select>
          </div>

          {/* Video Quality */}
          <div>
            <label className="block text-sm font-medium mb-2">Video Quality</label>
            <select
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
            <label className="block text-sm font-medium mb-2">Audio Quality</label>
            <select
              value={settings.audioQuality}
              onChange={(e) => setSetting('audioQuality', e.target.value as AudioQuality)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            >
              <option value="low">Low (96 kbps)</option>
              <option value="medium">Medium (128 kbps)</option>
              <option value="high">High (256 kbps)</option>
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => {
                const newTheme = e.target.value as 'light' | 'dark';
                setSetting('theme', newTheme);
                // Aplicar inmediatamente
                if (newTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
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
