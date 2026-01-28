export interface ElectronAPI {
  startRecording: (settings: any) => Promise<string>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  getDisplaySources: () => Promise<any[]>;
  selectOutputPath: () => Promise<string>;
  openFile: (path: string) => Promise<void>;
  getAudioDevices: () => Promise<any[]>;
  testMicrophone: () => Promise<boolean>;
  getSessions: () => Promise<any[]>;
  deleteSession: (id: string) => Promise<void>;
  saveSettings: (settings: any) => Promise<void>;
  loadSettings: () => Promise<any>;
  getSystemInfo: () => Promise<any>;
  saveVideoChunk: (chunk: Uint8Array) => Promise<void>;
  convertToMp4: (webmPath: string) => Promise<void>;
  onRecordingTick: (callback: (duration: number) => void) => () => void;
  onRecordingError: (callback: (error: string) => void) => () => void;
  onRecordingComplete: (callback: (session: any) => void) => () => void;
  onConversionProgress: (callback: (data: { sessionId: string; percent: number }) => void) => () => void;
  onConversionComplete: (callback: (data: { sessionId: string; mp4Path: string }) => void) => () => void;
  onConversionError: (callback: (data: { sessionId: string; error: string }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
