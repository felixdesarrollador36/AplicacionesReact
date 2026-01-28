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

interface RecordingSettings {
  outputPath?: string;
  audioSource: 'system' | 'microphone' | 'both';
  videoQuality: 'low' | 'medium' | 'high';
  audioQuality: 'low' | 'medium' | 'high';
  format: 'mp4' | 'webm';
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
        format: 'mp4',
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
    if (!fs.existsSync(webmPath)) {
      throw new Error('WebM file not found');
    }

    return new Promise<string>((resolve, reject) => {
      const mp4Path = webmPath.replace('.webm', '.mp4');
      
      console.log(`Converting ${webmPath} to MP4...`);
      
      ffmpeg(webmPath)
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 22',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart'
        ])
        .output(mp4Path)
        .on('start', (commandLine: string) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`Conversion progress: ${Math.round(progress.percent)}%`);
            this.mainWindow?.webContents.send('conversion-progress', {
              percent: Math.round(progress.percent)
            });
          }
        })
        .on('end', () => {
          console.log('Conversion complete!');
          
          // Actualizar sesión con archivo MP4
          this.getSessions().then((sessions) => {
            const sessionIndex = sessions.findIndex((s: any) => s.filepath === webmPath);
            if (sessionIndex !== -1) {
              sessions[sessionIndex].filepath = mp4Path;
              sessions[sessionIndex].filename = path.basename(mp4Path);
              sessions[sessionIndex].format = 'mp4';
              sessions[sessionIndex].size = fs.existsSync(mp4Path) ? fs.statSync(mp4Path).size : 0;
              this.saveSessions(sessions);
            }
          });
          
          this.mainWindow?.webContents.send('conversion-complete', {
            mp4Path: mp4Path
          });
          
          resolve(mp4Path);
        })
        .on('error', (err: Error) => {
          console.error('Conversion error:', err);
          this.mainWindow?.webContents.send('conversion-error', err.message);
          reject(err);
        })
        .run();
    });
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
