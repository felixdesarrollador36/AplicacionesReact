import { create } from 'zustand';
import { RecordingState, RecordingSession, AppSettings } from '../types/recording';

interface RecordingStore extends RecordingState {
  setRecording: (isRecording: boolean) => void;
  setPaused: (isPaused: boolean) => void;
  setDuration: (duration: number) => void;
  setCurrentSession: (session?: RecordingSession) => void;
  setError: (error?: string) => void;
  resetState: () => void;
}

const initialState: RecordingState = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  currentSession: undefined,
  error: undefined,
};

export const useRecordingStore = create<RecordingStore>((set) => ({
  ...initialState,
  setRecording: (isRecording) => set({ isRecording }),
  setPaused: (isPaused) => set({ isPaused }),
  setDuration: (duration) => set({ duration }),
  setCurrentSession: (currentSession) => set({ currentSession }),
  setError: (error) => set({ error }),
  resetState: () => set(initialState),
}));

interface SettingsStore {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  defaultOutputPath: '',
  enableCameraOverlay: false,
  audioSource: 'both',
  videoQuality: 'high',
  audioQuality: 'high',
  autoSavePreferences: true,
  theme: 'dark',
  transcriptionProvider: 'openai',
  transcriptionApiBaseUrl: 'https://api.openai.com/v1',
  transcriptionApiKey: '',
  transcriptionModel: 'whisper-1',
  transcriptionLanguage: '',
  autoTranscribe: false,
  generateSubtitles: true,
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,
  setSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
  loadSettings: async () => {
    try {
      if (!window.electronAPI) {
        console.warn('electronAPI not available, using default settings');
        return;
      }
      const settings = await window.electronAPI.loadSettings();
      set({ settings: { ...defaultSettings, ...settings } });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },
  saveSettings: async () => {
    try {
      if (!window.electronAPI) {
        console.warn('electronAPI not available, settings not saved');
        return;
      }
      const state = useSettingsStore.getState();
      await window.electronAPI.saveSettings(state.settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },
}));

interface SessionStore {
  sessions: RecordingSession[];
  setSessions: (sessions: RecordingSession[]) => void;
  addSession: (session: RecordingSession) => void;
  removeSession: (id: string) => void;
  loadSessions: () => Promise<void>;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions],
    })),
  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
    })),
  loadSessions: async () => {
    try {
      if (!window.electronAPI) {
        console.warn('electronAPI not available, using fallback');
        set({ sessions: [] });
        return;
      }
      const sessions = await window.electronAPI.getSessions();
      set({ sessions });
    } catch (error) {
      console.error('Failed to load sessions:', error);
      set({ sessions: [] });
    }
  },
}));
