import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScreenRecorder } from './useScreenRecorder';

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();
global.navigator = {
  ...global.navigator,
  mediaDevices: {
    getUserMedia: mockGetUserMedia,
  },
} as any;

// Mock MediaRecorder
class MockMediaRecorder {
  state = 'inactive';
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((error: any) => void) | null = null;

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) {
      this.onstop();
    }
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }
}

global.MediaRecorder = MockMediaRecorder as any;

describe('useScreenRecorder Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Casos positivos
  it('should initialize without errors', () => {
    const { result } = renderHook(() => useScreenRecorder());
    
    expect(result.current).toBeDefined();
    expect(result.current.startRecording).toBeInstanceOf(Function);
    expect(result.current.stopRecording).toBeInstanceOf(Function);
    expect(result.current.pauseRecording).toBeInstanceOf(Function);
    expect(result.current.resumeRecording).toBeInstanceOf(Function);
  });

  it('should start recording successfully with valid source', async () => {
    const mockVideoStream = {
      getVideoTracks: () => [{ kind: 'video' }],
      getTracks: () => [{ kind: 'video', stop: vi.fn() }],
    };

    const mockAudioStream = {
      getAudioTracks: () => [{ kind: 'audio' }],
      getTracks: () => [{ kind: 'audio', stop: vi.fn() }],
    };

    mockGetUserMedia
      .mockResolvedValueOnce(mockVideoStream)
      .mockResolvedValueOnce(mockAudioStream);

    const { result } = renderHook(() => useScreenRecorder());

    await act(async () => {
      const success = await result.current.startRecording('test-source-id');
      expect(success).toBe(true);
    });

    expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
  });

  it('should start recording without audio if microphone fails', async () => {
    const mockVideoStream = {
      getVideoTracks: () => [{ kind: 'video' }],
      getTracks: () => [{ kind: 'video', stop: vi.fn() }],
    };

    mockGetUserMedia
      .mockResolvedValueOnce(mockVideoStream)
      .mockRejectedValueOnce(new Error('Audio not available'));

    const { result } = renderHook(() => useScreenRecorder());

    await act(async () => {
      const success = await result.current.startRecording('test-source-id');
      expect(success).toBe(true);
    });
  });

  // Casos negativos
  it('should throw error when screen capture fails', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Screen capture denied'));

    const { result } = renderHook(() => useScreenRecorder());

    await expect(async () => {
      await act(async () => {
        await result.current.startRecording('invalid-source');
      });
    }).rejects.toThrow();
  });

  it('should handle empty source ID', async () => {
    const { result } = renderHook(() => useScreenRecorder());

    await expect(async () => {
      await act(async () => {
        await result.current.startRecording('');
      });
    }).rejects.toThrow();
  });

  it('should reject stopRecording when not recording', async () => {
    const { result } = renderHook(() => useScreenRecorder());

    await expect(async () => {
      await act(async () => {
        await result.current.stopRecording();
      });
    }).rejects.toThrow('No active recording');
  });

  it('should handle invalid source ID format', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Invalid source'));

    const { result } = renderHook(() => useScreenRecorder());

    await expect(async () => {
      await act(async () => {
        await result.current.startRecording('invalid@#$%');
      });
    }).rejects.toThrow();
  });
});
