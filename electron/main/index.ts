import { app, BrowserWindow, ipcMain, desktopCapturer, dialog } from 'electron';
import * as path from 'path';
import { RecordingManager } from './recording-manager';

let mainWindow: BrowserWindow | null = null;
let recordingManager: RecordingManager;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // En producción, buscar el HTML en múltiples ubicaciones posibles
    const possiblePaths = [
      path.join(__dirname, '../../dist/react/index.html'),
      path.join(__dirname, '../../../dist/react/index.html'),
      path.join(process.resourcesPath, 'app/dist/react/index.html'),
      path.join(app.getAppPath(), 'dist/react/index.html'),
    ];
    
    const fs = require('fs');
    let htmlPath = possiblePaths[0];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        htmlPath = p;
        break;
      }
    }
    
    console.log('Loading HTML from:', htmlPath);
    mainWindow.loadFile(htmlPath);
  }

  if (isDev) {
    mainWindow.webContents.openDevTools();
  } else {
    // Abrir DevTools en producción para debug
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  recordingManager = new RecordingManager(mainWindow);
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle('start-recording', async (_event, settings) => {
  try {
    return await recordingManager.startRecording(settings);
  } catch (error) {
    mainWindow?.webContents.send('recording-error', (error as Error).message);
    throw error;
  }
});

ipcMain.handle('stop-recording', async () => {
  try {
    return await recordingManager.stopRecording();
  } catch (error) {
    mainWindow?.webContents.send('recording-error', (error as Error).message);
    throw error;
  }
});

ipcMain.handle('pause-recording', async () => {
  try {
    return await recordingManager.pauseRecording();
  } catch (error) {
    mainWindow?.webContents.send('recording-error', (error as Error).message);
    throw error;
  }
});

ipcMain.handle('resume-recording', async () => {
  try {
    return await recordingManager.resumeRecording();
  } catch (error) {
    mainWindow?.webContents.send('recording-error', (error as Error).message);
    throw error;
  }
});

ipcMain.handle('get-display-sources', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] });
  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL(),
    type: source.id.startsWith('screen') ? 'screen' : 'window',
  }));
});

ipcMain.handle('select-output-path', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  return result.filePaths[0] || '';
});

ipcMain.handle('open-file', async (_event, filepath: string) => {
  const { shell } = require('electron');
  await shell.openPath(filepath);
});

ipcMain.handle('get-audio-devices', async () => {
  // Implementation will depend on your audio system
  return [
    { id: 'default', label: 'Default Audio Device', kind: 'audioinput' },
  ];
});

ipcMain.handle('test-microphone', async () => {
  return recordingManager.testMicrophone();
});

ipcMain.handle('get-sessions', async () => {
  return recordingManager.getSessions();
});

ipcMain.handle('delete-session', async (_event, sessionId: string) => {
  return recordingManager.deleteSession(sessionId);
});

ipcMain.handle('save-settings', async (_event, settings) => {
  return recordingManager.saveSettings(settings);
});

ipcMain.handle('load-settings', async () => {
  return recordingManager.loadSettings();
});

ipcMain.handle('get-system-info', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
  };
});

// Handler to receive video data chunks from renderer
ipcMain.handle('save-video-chunk', async (_event, chunk: Uint8Array) => {
  return recordingManager.saveVideoChunk(Buffer.from(chunk));
});

// Handler for manual MP4 conversion
ipcMain.handle('convert-to-mp4', async (_event, webmPath: string) => {
  return recordingManager.convertToMp4Manual(webmPath);
});
