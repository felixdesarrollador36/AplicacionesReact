export interface ConversionProgressEvent {
  percent: number;
  targetFormat: 'mp4' | 'mp3';
}

export interface ConversionCompleteEvent {
  outputPath: string;
  targetFormat: 'mp4' | 'mp3';
}

export interface ConversionErrorEvent {
  error: string;
  targetFormat: 'mp4' | 'mp3';
}

export interface TranscriptionProgressEvent {
  percent: number;
  phase: string;
  inputPath: string;
}

export interface TranscriptionCompleteEvent {
  inputPath: string;
  transcriptPath: string;
  subtitlePath?: string;
}

export interface TranscriptionErrorEvent {
  inputPath: string;
  error: string;
}

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
  getDefaultRecordingPath: () => Promise<string>;
  getSystemInfo: () => Promise<any>;
  saveVideoChunk: (chunk: Uint8Array) => Promise<void>;
  convertToMp4: (webmPath: string) => Promise<void>;
  convertToMp3: (inputPath: string) => Promise<void>;
  transcribeRecording: (inputPath: string) => Promise<{ transcriptPath: string; subtitlePath?: string }>;
  onRecordingTick: (callback: (duration: number) => void) => () => void;
  onRecordingError: (callback: (error: string) => void) => () => void;
  onRecordingComplete: (callback: (session: any) => void) => () => void;
  onConversionProgress: (callback: (data: ConversionProgressEvent) => void) => () => void;
  onConversionComplete: (callback: (data: ConversionCompleteEvent) => void) => () => void;
  onConversionError: (callback: (data: ConversionErrorEvent) => void) => () => void;
  onTranscriptionProgress: (callback: (data: TranscriptionProgressEvent) => void) => () => void;
  onTranscriptionComplete: (callback: (data: TranscriptionCompleteEvent) => void) => () => void;
  onTranscriptionError: (callback: (data: TranscriptionErrorEvent) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
