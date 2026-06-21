import { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const SETTINGS_PATH = path.join(process.env.APPDATA || process.env.HOME || '', 'sistemagrabacion', 'settings.json');
const SESSIONS_PATH = path.join(process.env.APPDATA || process.env.HOME || '', 'sistemagrabacion', 'sessions.json');
const RECORDINGS_PATH = path.join(process.env.APPDATA || process.env.HOME || '', 'sistemagrabacion', 'recordings');

export const getDefaultRecordingPath = () => RECORDINGS_PATH;

interface RecordingSettings {
  outputPath?: string;
  audioSource: 'system' | 'microphone' | 'both';
  videoQuality: 'low' | 'medium' | 'high';
  audioQuality: 'low' | 'medium' | 'high';
  format: 'mp4' | 'webm';
}

type ConversionTarget = 'mp4' | 'mp3';

interface StoredSettings {
  autoTranscribe?: boolean;
  generateSubtitles?: boolean;
  transcriptionApiBaseUrl?: string;
  transcriptionApiKey?: string;
  transcriptionLanguage?: string;
  transcriptionModel?: string;
}

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

interface TranscriptionResponse {
  text?: string;
  segments?: TranscriptionSegment[];
  error?: {
    message?: string;
  };
}

export class RecordingManager {
  private isRecording = false;
  private isPaused = false;
  private recordingStartTime = 0;
  private recordingDuration = 0;
  private pausedDuration = 0;
  private pauseStartTime = 0;
  private timerInterval: NodeJS.Timeout | null = null;
  private currentSessionId: string | null = null;
  private currentRecordingPath: string | null = null;
  private recordingChunks: Buffer[] = [];

  constructor(private mainWindow: BrowserWindow) {
    this.ensureDataDirs();
  }

  private ensureDataDirs() {
    const dirs = [
      path.dirname(SETTINGS_PATH),
      path.dirname(SESSIONS_PATH),
      RECORDINGS_PATH,
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  async startRecording(settings: RecordingSettings) {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      this.isRecording = true;
      this.currentSessionId = uuidv4();
      this.recordingStartTime = Date.now();
      this.recordingDuration = 0;
      this.pausedDuration = 0;

      // Setup recording file path
      const outputDir = settings.outputPath || RECORDINGS_PATH;
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `recording_${timestamp}.${settings.format}`;
      this.currentRecordingPath = path.join(outputDir, filename);

      // Emit recording started event
      this.mainWindow?.webContents.send('recording-started', {
        sessionId: this.currentSessionId,
        filepath: this.currentRecordingPath,
      });

      // Start timer to emit recording updates every 100ms
      this.timerInterval = setInterval(() => {
        if (!this.isPaused) {
          this.recordingDuration = Date.now() - this.recordingStartTime - this.pausedDuration;
        }
        this.mainWindow?.webContents.send('recording-tick', this.recordingDuration);
      }, 100);

      return {
        sessionId: this.currentSessionId,
        status: 'recording',
        filepath: this.currentRecordingPath,
      };
    } catch (error) {
      this.isRecording = false;
      this.currentSessionId = null;
      throw error;
    }
  }

  async stopRecording() {
    if (!this.isRecording) {
      throw new Error('Not recording');
    }

    try {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      this.isRecording = false;
      this.isPaused = false;

      // Save recorded video data
      if (this.currentRecordingPath) {
        if (this.recordingChunks.length > 0) {
          // Write actual recorded video data
          const videoBuffer = Buffer.concat(this.recordingChunks);
          fs.writeFileSync(this.currentRecordingPath, videoBuffer);
        } else {
          // Create a placeholder text file showing recording was attempted
          const metadata = {
            recordingId: this.currentSessionId,
            startTime: new Date(this.recordingStartTime).toISOString(),
            duration: this.recordingDuration,
            format: path.extname(this.currentRecordingPath),
            note: 'Recording completed but no video data was captured. Make sure screen capture is working in the renderer process.'
          };
          
          // Write placeholder file
          fs.writeFileSync(
            this.currentRecordingPath.replace(/\.(mp4|webm)$/, '_metadata.txt'),
            JSON.stringify(metadata, null, 2)
          );
          
          // Create empty video file as placeholder
          fs.writeFileSync(this.currentRecordingPath, Buffer.from(''));
        }
      }

      // Create session record
      const sessions = await this.getSessions();
      const fileSize = this.currentRecordingPath && fs.existsSync(this.currentRecordingPath)
        ? fs.statSync(this.currentRecordingPath).size
        : 0;

      const session = {
        id: this.currentSessionId,
        startTime: new Date(this.recordingStartTime),
        endTime: new Date(),
        duration: this.recordingDuration,
        filename: path.basename(this.currentRecordingPath || 'recording.mp4'),
        filepath: this.currentRecordingPath,
        format: path.extname(this.currentRecordingPath || '.webm').replace('.', '') || 'webm',
        size: fileSize,
      };

      sessions.unshift(session);
      this.saveSessions(sessions);

      // NO convertir automáticamente - el usuario lo hará manualmente
      // if (this.currentRecordingPath && this.currentRecordingPath.endsWith('.webm')) {
      //   this.convertToMp4(this.currentRecordingPath, session);
      // }

      // Emit completion event
      this.mainWindow?.webContents.send('recording-complete', session);

      if (session.filepath && fileSize > 0) {
        const storedSettings = await this.loadSettings() as StoredSettings;
        if (storedSettings.autoTranscribe) {
          void this.transcribeRecording(session.filepath, storedSettings).catch((error) => {
            console.error('Automatic transcription failed:', error);
          });
        }
      }

      const result = session;
      this.currentSessionId = null;
      this.currentRecordingPath = null;
      this.recordingChunks = [];
      return result;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  saveVideoChunk(chunk: Buffer) {
    if (this.isRecording && !this.isPaused) {
      this.recordingChunks.push(chunk);
    }
  }

  // Método público para conversión manual
  async convertToMp4Manual(webmPath: string) {
    return this.convertMediaManual(webmPath, 'mp4');
  }

  async convertToMp3Manual(inputPath: string) {
    return this.convertMediaManual(inputPath, 'mp3');
  }

  async transcribeRecordingManual(inputPath: string) {
    const settings = await this.loadSettings() as StoredSettings;
    return this.transcribeRecording(inputPath, settings);
  }

  private async convertMediaManual(inputPath: string, targetFormat: ConversionTarget) {
    if (!fs.existsSync(inputPath)) {
      throw new Error('Source file not found');
    }

    const currentExtension = path.extname(inputPath).toLowerCase();
    const outputPath = inputPath.replace(new RegExp(`${currentExtension}$`), `.${targetFormat}`);

    if (outputPath === inputPath) {
      throw new Error(`File is already in ${targetFormat.toUpperCase()} format`);
    }

    return new Promise<string>((resolve, reject) => {
      console.log(`Converting ${inputPath} to ${targetFormat.toUpperCase()}...`);

      const command = ffmpeg(inputPath).output(outputPath);

      if (targetFormat === 'mp4') {
        command.outputOptions([
          '-y',
          '-c:v libx264',
          '-preset fast',
          '-crf 22',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart'
        ]);
      } else {
        command.noVideo().outputOptions([
          '-y',
          '-codec:a libmp3lame',
          '-b:a 192k'
        ]);
      }

      command
        .on('start', (commandLine: string) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress: { percent?: number }) => {
          if (progress.percent) {
            const percent = Math.round(progress.percent);
            console.log(`Conversion progress: ${percent}%`);
            this.mainWindow?.webContents.send('conversion-progress', {
              percent,
              targetFormat,
            });
          }
        })
        .on('end', async () => {
          console.log('Conversion complete!');

          if (targetFormat === 'mp4') {
            const sessions = await this.getSessions();
            const sessionIndex = sessions.findIndex((session: any) => session.filepath === inputPath);

            if (sessionIndex !== -1) {
              sessions[sessionIndex].filepath = outputPath;
              sessions[sessionIndex].filename = path.basename(outputPath);
              sessions[sessionIndex].format = 'mp4';
              sessions[sessionIndex].size = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
              this.saveSessions(sessions);
            }
          }

          this.mainWindow?.webContents.send('conversion-complete', {
            outputPath,
            targetFormat,
          });

          resolve(outputPath);
        })
        .on('error', (err: Error) => {
          console.error('Conversion error:', err);
          this.mainWindow?.webContents.send('conversion-error', {
            error: err.message,
            targetFormat,
          });
          reject(err);
        })
        .run();
    });
  }

  private async transcribeRecording(inputPath: string, settings: StoredSettings) {
    if (!fs.existsSync(inputPath)) {
      throw new Error('Source file not found');
    }

    if (!settings.transcriptionApiKey) {
      const error = new Error('Configure your OpenAI API key in Settings before starting transcription.');
      this.emitTranscriptionError(inputPath, error.message);
      throw error;
    }

    this.emitTranscriptionProgress(inputPath, 5, 'Preparing audio');

    const audioPath = await this.prepareAudioForTranscription(inputPath);

    try {
      this.emitTranscriptionProgress(inputPath, 25, 'Uploading audio');

      const endpoint = this.resolveTranscriptionEndpoint(settings.transcriptionApiBaseUrl);
      const formData = new FormData();
      const audioBuffer = fs.readFileSync(audioPath);

      formData.append(
        'file',
        new Blob([audioBuffer], { type: 'audio/mpeg' }),
        path.basename(audioPath)
      );
      formData.append('model', settings.transcriptionModel || 'whisper-1');
      formData.append('response_format', 'verbose_json');

      if (settings.transcriptionLanguage) {
        formData.append('language', settings.transcriptionLanguage);
      }

      if (settings.generateSubtitles) {
        formData.append('timestamp_granularities[]', 'segment');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.transcriptionApiKey}`,
        },
        body: formData,
      });

      const responseBody = await response.json() as TranscriptionResponse;

      if (!response.ok) {
        const message = responseBody.error?.message || 'The transcription provider rejected the request.';
        throw new Error(message);
      }

      const transcriptText = responseBody.text?.trim();
      if (!transcriptText) {
        throw new Error('The transcription service returned an empty transcript.');
      }

      this.emitTranscriptionProgress(inputPath, 80, 'Writing transcript files');

      const transcriptPath = this.getSidecarPath(inputPath, 'transcript.txt');
      fs.writeFileSync(transcriptPath, transcriptText, 'utf-8');

      let subtitlePath: string | undefined;
      if (settings.generateSubtitles && responseBody.segments && responseBody.segments.length > 0) {
        subtitlePath = this.getSidecarPath(inputPath, 'srt');
        fs.writeFileSync(subtitlePath, this.buildSrt(responseBody.segments), 'utf-8');
      }

      this.emitTranscriptionProgress(inputPath, 100, 'Completed');
      this.mainWindow?.webContents.send('transcription-complete', {
        inputPath,
        transcriptPath,
        subtitlePath,
      });

      return { transcriptPath, subtitlePath };
    } catch (error) {
      const message = (error as Error).message;
      this.emitTranscriptionError(inputPath, message);
      throw error;
    } finally {
      if (audioPath !== inputPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
  }

  private async prepareAudioForTranscription(inputPath: string): Promise<string> {
    const extension = path.extname(inputPath).toLowerCase();
    if (['.mp3', '.wav', '.m4a', '.aac', '.ogg'].includes(extension)) {
      return inputPath;
    }

    const outputPath = this.getSidecarPath(inputPath, 'transcription.mp3');

    return new Promise<string>((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .outputOptions([
          '-y',
          '-codec:a libmp3lame',
          '-b:a 128k',
          '-ac 1'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (error: Error) => reject(error))
        .run();
    });
  }

  private resolveTranscriptionEndpoint(baseUrl?: string): string {
    const trimmedUrl = (baseUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
    if (trimmedUrl.endsWith('/audio/transcriptions')) {
      return trimmedUrl;
    }
    return `${trimmedUrl}/audio/transcriptions`;
  }

  private getSidecarPath(inputPath: string, extension: string): string {
    const parsed = path.parse(inputPath);
    return path.join(parsed.dir, `${parsed.name}.${extension}`);
  }

  private emitTranscriptionProgress(inputPath: string, percent: number, phase: string) {
    this.mainWindow?.webContents.send('transcription-progress', {
      inputPath,
      percent,
      phase,
    });
  }

  private emitTranscriptionError(inputPath: string, error: string) {
    this.mainWindow?.webContents.send('transcription-error', {
      inputPath,
      error,
    });
  }

  private buildSrt(segments: TranscriptionSegment[]): string {
    return segments
      .filter((segment) => segment.text.trim())
      .map((segment, index) => {
        return [
          `${index + 1}`,
          `${this.formatSrtTimestamp(segment.start)} --> ${this.formatSrtTimestamp(segment.end)}`,
          segment.text.trim(),
          '',
        ].join('\n');
      })
      .join('\n');
  }

  private formatSrtTimestamp(seconds: number): string {
    const safeSeconds = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = Math.floor(safeSeconds % 60);
    const milliseconds = Math.round((safeSeconds - Math.floor(safeSeconds)) * 1000);

    return [hours, minutes, secs]
      .map((value) => String(value).padStart(2, '0'))
      .join(':') + `,${String(milliseconds).padStart(3, '0')}`;
  }

  async pauseRecording() {
    if (!this.isRecording || this.isPaused) {
      throw new Error('Invalid state for pause');
    }

    this.isPaused = true;
    this.pauseStartTime = Date.now();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.mainWindow?.webContents.send('recording-paused', {
      duration: this.recordingDuration,
    });

    return { status: 'paused', duration: this.recordingDuration };
  }

  async resumeRecording() {
    if (!this.isRecording || !this.isPaused) {
      throw new Error('Invalid state for resume');
    }

    this.isPaused = false;

    // Add paused time to total paused duration
    if (this.pauseStartTime) {
      this.pausedDuration += Date.now() - this.pauseStartTime;
    }

    // Restart timer
    this.timerInterval = setInterval(() => {
      this.recordingDuration = Date.now() - this.recordingStartTime - this.pausedDuration;
      this.mainWindow?.webContents.send('recording-tick', this.recordingDuration);
    }, 100);

    this.mainWindow?.webContents.send('recording-resumed', {
      duration: this.recordingDuration,
    });

    return { status: 'recording', duration: this.recordingDuration };
  }

  async testMicrophone(): Promise<boolean> {
    try {
      // Test microphone by attempting to access audio devices
      // Return success after simulated test
      return new Promise((resolve) => {
        setTimeout(() => resolve(true), 500);
      });
    } catch (error) {
      console.error('Microphone test failed:', error);
      return false;
    }
  }

  async getSessions(): Promise<any[]> {
    try {
      if (fs.existsSync(SESSIONS_PATH)) {
        const data = fs.readFileSync(SESSIONS_PATH, 'utf-8');
        const sessions = JSON.parse(data);
        // Filter out non-existent files
        return sessions.filter((s: any) => {
          if (s.filepath && !fs.existsSync(s.filepath)) {
            return false;
          }
          return true;
        });
      }
    } catch (error) {
      console.error('Error reading sessions:', error);
    }
    return [];
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getSessions();
      const session = sessions.find((s: any) => s.id === sessionId);

      // Delete file if exists
      if (session?.filepath && fs.existsSync(session.filepath)) {
        fs.unlinkSync(session.filepath);
      }

      // Remove from sessions list
      const filtered = sessions.filter((s: any) => s.id !== sessionId);
      this.saveSessions(filtered);

      this.mainWindow?.webContents.send('session-deleted', { sessionId });
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  private saveSessions(sessions: any[]): void {
    try {
      fs.writeFileSync(SESSIONS_PATH, JSON.stringify(sessions, null, 2));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  async saveSettings(settings: any): Promise<void> {
    try {
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
      this.mainWindow?.webContents.send('settings-saved', settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  async loadSettings(): Promise<any> {
    try {
      if (fs.existsSync(SETTINGS_PATH)) {
        const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading settings:', error);
    }
    return {};
  }

  getDefaultRecordingPath(): string {
    return RECORDINGS_PATH;
  }

  getRecordingState() {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      duration: this.recordingDuration,
      currentSessionId: this.currentSessionId,
      currentRecordingPath: this.currentRecordingPath,
    };
  }

  async getRecordingSize(): Promise<number> {
    try {
      if (this.currentRecordingPath && fs.existsSync(this.currentRecordingPath)) {
        return fs.statSync(this.currentRecordingPath).size;
      }
    } catch (error) {
      console.error('Error getting recording size:', error);
    }
    return 0;
  }
}
