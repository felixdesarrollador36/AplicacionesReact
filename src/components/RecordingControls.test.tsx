import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecordingControls } from './RecordingControls';
import { useRecordingStore } from '../store/recording';

// Mock the store
vi.mock('../store/recording', () => ({
  useRecordingStore: vi.fn(),
}));

describe('RecordingControls Component', () => {
  const mockOnStart = vi.fn();
  const mockOnPause = vi.fn();
  const mockOnResume = vi.fn();
  const mockOnStop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRecordingStore as any).mockReturnValue({
      isRecording: false,
      isPaused: false,
      duration: 0,
    });
  });

  // Casos positivos
  it('should render with default state (not recording)', () => {
    render(
      <RecordingControls
        onStart={mockOnStart}
        onPause={mockOnPause}
        onResume={mockOnResume}
        onStop={mockOnStop}
      />
    );

    expect(screen.getByText('Ready to record')).toBeDefined();
    expect(screen.getByText('Start')).toBeDefined();
  });

  it('should display recording state correctly', () => {
    (useRecordingStore as any).mockReturnValue({
      isRecording: true,
      isPaused: false,
      duration: 5000,
    });

    render(
      <RecordingControls
        onStart={mockOnStart}
        onPause={mockOnPause}
        onResume={mockOnResume}
        onStop={mockOnStop}
      />
    );

    expect(screen.getByText('Recording...')).toBeDefined();
    expect(screen.getByText('Pause')).toBeDefined();
    expect(screen.getByText('Stop')).toBeDefined();
  });

  it('should call onStart when Start button is clicked', () => {
    render(
      <RecordingControls
        onStart={mockOnStart}
        onPause={mockOnPause}
        onResume={mockOnResume}
        onStop={mockOnStop}
      />
    );

    fireEvent.click(screen.getByText('Start'));
    expect(mockOnStart).toHaveBeenCalledTimes(1);
  });

  it('should call onPause when Pause button is clicked', () => {
    (useRecordingStore as any).mockReturnValue({
      isRecording: true,
      isPaused: false,
      duration: 1000,
    });

    render(
      <RecordingControls
        onStart={mockOnStart}
        onPause={mockOnPause}
        onResume={mockOnResume}
        onStop={mockOnStop}
      />
    );

    fireEvent.click(screen.getByText('Pause'));
    expect(mockOnPause).toHaveBeenCalledTimes(1);
  });

  it('should call onResume when Resume button is clicked', () => {
    (useRecordingStore as any).mockReturnValue({
      isRecording: true,
      isPaused: true,
      duration: 1000,
    });

    render(
      <RecordingControls
        onStart={mockOnStart}
        onPause={mockOnPause}
        onResume={mockOnResume}
        onStop={mockOnStop}
      />
    );

    fireEvent.click(screen.getByText('Resume'));
    expect(mockOnResume).toHaveBeenCalledTimes(1);
  });

  it('should call onStop when Stop button is clicked', () => {
    (useRecordingStore as any).mockReturnValue({
      isRecording: true,
      isPaused: false,
      duration: 1000,
    });

    render(
      <RecordingControls
        onStart={mockOnStart}
        onPause={mockOnPause}
        onResume={mockOnResume}
        onStop={mockOnStop}
      />
    );

    fireEvent.click(screen.getByText('Stop'));
    expect(mockOnStop).toHaveBeenCalledTimes(1);
  });

  it('should format duration correctly', () => {
    (useRecordingStore as any).mockReturnValue({
      isRecording: true,
      isPaused: false,
      duration: 65000, // 1 minute 5 seconds
    });

    render(
      <RecordingControls
        onStart={mockOnStart}
        onPause={mockOnPause}
        onResume={mockOnResume}
        onStop={mockOnStop}
      />
    );

    expect(screen.getByText(/01:05/)).toBeDefined();
  });

  // Casos negativos
  it('should disable buttons when isLoading is true', () => {
    render(
      <RecordingControls
        onStart={mockOnStart}
        onPause={mockOnPause}
        onResume={mockOnResume}
        onStop={mockOnStop}
        isLoading={true}
      />
    );

    const startButton = screen.getByText('Start').closest('button');
    expect(startButton?.hasAttribute('disabled')).toBe(true);
  });

  it('should not trigger callbacks when disabled', () => {
    render(
      <RecordingControls
        onStart={mockOnStart}
        onPause={mockOnPause}
        onResume={mockOnResume}
        onStop={mockOnStop}
        isLoading={true}
      />
    );

    const startButton = screen.getByText('Start').closest('button');
    if (startButton) {
      fireEvent.click(startButton);
    }
    expect(mockOnStart).not.toHaveBeenCalled();
  });

  it('should not show Start button when recording', () => {
    (useRecordingStore as any).mockReturnValue({
      isRecording: true,
      isPaused: false,
      duration: 1000,
    });

    render(
      <RecordingControls
        onStart={mockOnStart}
        onPause={mockOnPause}
        onResume={mockOnResume}
        onStop={mockOnStop}
      />
    );

    expect(screen.queryByText('Start')).toBeNull();
  });
});
