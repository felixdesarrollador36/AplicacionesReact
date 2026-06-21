import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.electronAPI globally
global.window = global.window || {};
global.window.electronAPI = {
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  pauseRecording: vi.fn(),
  resumeRecording: vi.fn(),
  getDisplaySources: vi.fn(),
  selectOutputPath: vi.fn(),
  openFile: vi.fn(),
  getAudioDevices: vi.fn(),
  testMicrophone: vi.fn(),
  getSessions: vi.fn(),
  deleteSession: vi.fn(),
  saveSettings: vi.fn(),
  loadSettings: vi.fn(),
  getDefaultRecordingPath: vi.fn(),
  getSystemInfo: vi.fn(),
  saveVideoChunk: vi.fn(),
  convertToMp4: vi.fn(),
  convertToMp3: vi.fn(),
  transcribeRecording: vi.fn(),
  onRecordingTick: vi.fn(() => () => {}),
  onRecordingError: vi.fn(() => () => {}),
  onRecordingComplete: vi.fn(() => () => {}),
  onConversionProgress: vi.fn(() => () => {}),
  onConversionComplete: vi.fn(() => () => {}),
  onConversionError: vi.fn(() => () => {}),
  onTranscriptionProgress: vi.fn(() => () => {}),
  onTranscriptionComplete: vi.fn(() => () => {}),
  onTranscriptionError: vi.fn(() => () => {}),
} as any;
