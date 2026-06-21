import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsPanel } from './SettingsPanel';
import { useSettingsStore } from '../store/recording';

vi.mock('../store/recording', () => ({
  useSettingsStore: vi.fn(),
}));

// Mock electronAPI
global.window.electronAPI = {
  selectOutputPath: vi.fn(),
  openFile: vi.fn(),
  getDefaultRecordingPath: vi.fn().mockResolvedValue('C:\\Users\\Felix Lora\\AppData\\Roaming\\sistemagrabacion\\recordings'),
} as any;

describe('SettingsPanel Component', () => {
  const mockOnClose = vi.fn();
  const mockSetSetting = vi.fn();
  const mockSaveSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useSettingsStore as any).mockReturnValue({
      settings: {
        audioSource: 'microphone',
        videoQuality: 'medium',
        audioQuality: 'medium',
        theme: 'dark',
        autoSavePreferences: true,
        outputPath: '',
        defaultOutputPath: 'C:\\recordings',
        transcriptionProvider: 'openai',
        transcriptionApiBaseUrl: 'https://api.openai.com/v1',
        transcriptionApiKey: '',
        transcriptionModel: 'whisper-1',
        transcriptionLanguage: 'es',
        autoTranscribe: false,
        generateSubtitles: true,
      },
      setSetting: mockSetSetting,
      saveSettings: mockSaveSettings,
    });
  });

  // Casos positivos
  it('should render when isOpen is true', () => {
    render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('should show the current recording folder', async () => {
    render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

    expect(await screen.findByText('Current recording folder')).toBeInTheDocument();
    expect(screen.getByDisplayValue('C:\\recordings')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(<SettingsPanel isOpen={false} onClose={mockOnClose} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should call onClose when X button is clicked', () => {
    render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call saveSettings when Save button is clicked', async () => {
    mockSaveSettings.mockResolvedValue(undefined);
    
    render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('Save'));
    
    await vi.waitFor(() => {
      expect(mockSaveSettings).toHaveBeenCalledTimes(1);
    });
  });

  it('should update audio source setting', () => {
    render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);
    
    const audioSourceSelect = screen.getByLabelText(/audio source/i);
    fireEvent.change(audioSourceSelect, { target: { value: 'both' } });
    
    expect(mockSetSetting).toHaveBeenCalledWith('audioSource', 'both');
  });

  it('should update video quality setting', () => {
    render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);
    
    const videoQualitySelect = screen.getByLabelText(/video quality/i);
    fireEvent.change(videoQualitySelect, { target: { value: 'high' } });
    
    expect(mockSetSetting).toHaveBeenCalledWith('videoQuality', 'high');
  });

  it('should update audio quality setting', () => {
    render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);
    
    const audioQualitySelect = screen.getByLabelText(/audio quality/i);
    fireEvent.change(audioQualitySelect, { target: { value: 'high' } });
    
    expect(mockSetSetting).toHaveBeenCalledWith('audioQuality', 'high');
  });

  it('should update theme setting', () => {
    render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);
    
    const themeSelect = screen.getByLabelText(/theme/i);
    fireEvent.change(themeSelect, { target: { value: 'light' } });
    
    expect(mockSetSetting).toHaveBeenCalledWith('theme', 'light');
  });

  it('should update transcription base URL', () => {
    render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

    const apiBaseUrlInput = screen.getByLabelText(/openai base url/i);
    fireEvent.change(apiBaseUrlInput, { target: { value: 'https://example.com/v1' } });

    expect(mockSetSetting).toHaveBeenCalledWith('transcriptionApiBaseUrl', 'https://example.com/v1');
  });

  it('should toggle automatic transcription', () => {
    render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

    const checkbox = screen.getByLabelText(/transcribe automatically after each recording/i);
    fireEvent.click(checkbox);

    expect(mockSetSetting).toHaveBeenCalledWith('autoTranscribe', true);
  });

  it('should toggle auto-save checkbox', () => {
    render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);
    
    const checkbox = screen.getByLabelText(/auto-save preferences/i);
    fireEvent.click(checkbox);
    
    expect(mockSetSetting).toHaveBeenCalledWith('autoSavePreferences', false);
  });

  // Casos negativos
  it('should handle save error gracefully', async () => {
    mockSaveSettings.mockRejectedValue(new Error('Save failed'));
    global.alert = vi.fn();
    
    render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('Save'));
    
    await vi.waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to save settings');
    });
  });

  it('should disable Save button while saving', async () => {
    mockSaveSettings.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);
    
    const saveButton = screen.getByText('Save').closest('button');
    fireEvent.click(saveButton!);
    
    expect(saveButton?.hasAttribute('disabled')).toBe(true);
  });
});
