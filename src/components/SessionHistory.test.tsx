import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionHistory } from './SessionHistory';
import { useSessionStore } from '../store/recording';

vi.mock('../store/recording', () => ({
  useSessionStore: vi.fn(),
}));

describe('SessionHistory Component', () => {
  const loadSessions = vi.fn();
  const removeSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useSessionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      sessions: [
        {
          id: 'session-1',
          filename: 'demo.webm',
          filepath: 'C:/recordings/demo.webm',
          startTime: new Date('2026-04-24T10:00:00.000Z'),
          duration: 65000,
          size: 2048,
          format: 'webm',
        },
      ],
      removeSession,
      loadSessions,
    });
  });

  it('shows MP4 and MP3 conversion actions for webm recordings', async () => {
    render(<SessionHistory />);

    expect(await screen.findByLabelText('Convertir a MP4')).toBeInTheDocument();
    expect(screen.getByLabelText('Convertir a MP3')).toBeInTheDocument();
    expect(screen.getByLabelText('Transcribir grabación')).toBeInTheDocument();
  });

  it('calls convertToMp3 when the MP3 action is clicked', async () => {
    render(<SessionHistory />);

    fireEvent.click(await screen.findByLabelText('Convertir a MP3'));

    await waitFor(() => {
      expect(window.electronAPI.convertToMp3).toHaveBeenCalledWith('C:/recordings/demo.webm');
    });
  });

  it('calls transcribeRecording when the transcription action is clicked', async () => {
    render(<SessionHistory />);

    fireEvent.click(await screen.findByLabelText('Transcribir grabación'));

    await waitFor(() => {
      expect(window.electronAPI.transcribeRecording).toHaveBeenCalledWith('C:/recordings/demo.webm');
    });
  });
});