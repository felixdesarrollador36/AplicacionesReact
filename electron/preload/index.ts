import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI } from '../../src/types/electron';

const electronAPI: ElectronAPI = {
  startRecording: (settings) => ipcRenderer.invoke('start-recording', settings),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),
  pauseRecording: () => ipcRenderer.invoke('pause-recording'),
  resumeRecording: () => ipcRenderer.invoke('resume-recording'),
  getDisplaySources: () => ipcRenderer.invoke('get-display-sources'),
  selectOutputPath: () => ipcRenderer.invoke('select-output-path'),
  openFile: (path) => ipcRenderer.invoke('open-file', path),
  getAudioDevices: () => ipcRenderer.invoke('get-audio-devices'),
  testMicrophone: () => ipcRenderer.invoke('test-microphone'),
  getSessions: () => ipcRenderer.invoke('get-sessions'),
  deleteSession: (id) => ipcRenderer.invoke('delete-session', id),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  getDefaultRecordingPath: () => ipcRenderer.invoke('get-default-recording-path'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  saveVideoChunk: (chunk) => ipcRenderer.invoke('save-video-chunk', chunk),
  convertToMp4: (webmPath) => ipcRenderer.invoke('convert-to-mp4', webmPath),
  convertToMp3: (inputPath) => ipcRenderer.invoke('convert-to-mp3', inputPath),
  transcribeRecording: (inputPath) => ipcRenderer.invoke('transcribe-recording', inputPath),
  onRecordingTick: (callback) => {
    const listener = (_event: any, duration: number) => callback(duration);
    ipcRenderer.on('recording-tick', listener);
    return () => ipcRenderer.removeListener('recording-tick', listener);
  },
  onRecordingError: (callback) => {
    const listener = (_event: any, error: string) => callback(error);
    ipcRenderer.on('recording-error', listener);
    return () => ipcRenderer.removeListener('recording-error', listener);
  },
  onRecordingComplete: (callback) => {
    const listener = (_event: any, session: any) => callback(session);
    ipcRenderer.on('recording-complete', listener);
    return () => ipcRenderer.removeListener('recording-complete', listener);
  },
  onConversionProgress: (callback) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('conversion-progress', listener);
    return () => ipcRenderer.removeListener('conversion-progress', listener);
  },
  onConversionComplete: (callback) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('conversion-complete', listener);
    return () => ipcRenderer.removeListener('conversion-complete', listener);
  },
  onConversionError: (callback) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('conversion-error', listener);
    return () => ipcRenderer.removeListener('conversion-error', listener);
  },
  onTranscriptionProgress: (callback) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('transcription-progress', listener);
    return () => ipcRenderer.removeListener('transcription-progress', listener);
  },
  onTranscriptionComplete: (callback) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('transcription-complete', listener);
    return () => ipcRenderer.removeListener('transcription-complete', listener);
  },
  onTranscriptionError: (callback) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('transcription-error', listener);
    return () => ipcRenderer.removeListener('transcription-error', listener);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
