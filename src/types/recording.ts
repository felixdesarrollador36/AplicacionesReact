export type RecordingMode = 'screen' | 'window' | 'tab';
export type AudioSource = 'system' | 'microphone' | 'both';
export type VideoQuality = 'low' | 'medium' | 'high';
export type AudioQuality = 'low' | 'medium' | 'high';
export type FileFormat = 'mp4' | 'webm';

export interface RecordingSettings {
  outputPath: string;
  filename: string;
  format: FileFormat;
  videoQuality: VideoQuality;
  audioQuality: AudioQuality;
  audioSource: AudioSource;
  recordingMode: RecordingMode;
}

export interface RecordingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  filename: string;
  filepath: string;
  duration?: number;
  format: FileFormat;
  size?: number;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  currentSession?: RecordingSession;
  error?: string;
}

export interface AudioDevice {
  id: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

export interface DisplaySource {
  id: string;
  name: string;
  thumbnail: string;
  type: 'screen' | 'window';
}

export interface AppSettings {
  defaultOutputPath: string;
  outputPath?: string;
  audioSource: AudioSource;
  videoQuality: VideoQuality;
  audioQuality: AudioQuality;
  autoSavePreferences: boolean;
  theme: 'light' | 'dark';
}
