# Sistema de Grabación - Desktop Screen & Audio Recording

A modern, cross-platform desktop application for recording screen and audio from Microsoft Teams, Google Meet, and other applications.

## Features

### 🎥 Recording Capabilities
- **Full Screen Recording**: Capture your entire display
- **Window Selection**: Record a specific application window
- **Tab Recording**: Record a specific browser tab
- **Audio Capture**: 
  - System audio (from Teams, Meet, etc.)
  - Microphone input
  - Combined system + microphone

### ⏯️ Recording Controls
- Start/Pause/Resume/Stop recording
- Real-time recording indicator
- Duration counter
- Visual feedback for recording status

### 💾 File Management
- Multiple format support (MP4, WebM)
- Custom output path selection
- Automatic filename generation with timestamps
- Recording history with playback
- Delete saved recordings

### ⚙️ Configuration
- Audio source selection
- Video quality options (720p/1080p/1440p)
- Audio quality presets
- Theme selection (Light/Dark)
- Microphone testing
- Persistent settings

### 📊 Session Management
- Complete recording history
- File information (duration, size, date)
- Direct playback from the app
- Session deletion with confirmation

## System Requirements

- **Windows 10/11** (primary support)
- **macOS 10.13+** (optional)
- **Linux** (optional)
- Minimum 4GB RAM
- 500MB free disk space for installation

## Installation

### Prerequisites
- Node.js 16+ and npm

### Setup

```bash
# Clone or extract the repository
cd sistemagrabacion

# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Package application
npm run package
```

## Development

### Project Structure

```
sistemagrabacion/
├── src/
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── services/         # Business logic
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript definitions
│   ├── utils/            # Helper functions
│   ├── index.tsx         # React entry point
│   └── index.css         # Global styles
├── electron/
│   ├── main/             # Electron main process
│   └── preload/          # Preload scripts
├── public/               # Static assets
└── dist/                 # Build output
```

### Scripts

- `npm run dev` - Start development server with Electron
- `npm run dev:react` - Start React dev server only
- `npm run dev:electron` - Start Electron only
- `npm run build` - Build for production
- `npm run build:react` - Build React app
- `npm run build:electron` - Build Electron processes
- `npm run package` - Create installer

## Architecture

### Frontend (React + TypeScript)
- Component-based UI with Tailwind CSS
- Zustand for state management
- Modern, responsive design
- Dark mode support

### Backend (Electron)
- Cross-platform desktop framework
- Native API integration
- Audio/Video capture
- File system operations
- Settings persistence

### Key Libraries
- **React 18**: UI framework
- **Vite**: Fast build tool
- **Electron**: Desktop framework
- **Zustand**: State management
- **Tailwind CSS**: Styling
- **Lucide React**: Icons

## Recording Settings

### Video Quality Presets
- **Low**: 720p @ 24fps
- **Medium**: 1080p @ 30fps
- **High**: 1440p @ 60fps

### Audio Quality Presets
- **Low**: 96 kbps
- **Medium**: 128 kbps
- **High**: 256 kbps

### Audio Sources
- **System Audio**: Capture application and system sounds
- **Microphone**: Capture microphone input
- **Both**: Combined system and microphone audio

## Usage

### Basic Recording

1. **Open the application**
2. **Configure audio settings** (optional)
   - Click the microphone icon
   - Select audio device and test microphone
3. **Click "Start"** to begin recording
4. **Use controls** to pause, resume, or stop
5. **Stop recording** when finished
6. **View in History** tab to manage recordings

### Before First Recording

- Test your microphone in Audio Setup
- Verify output path in Settings
- Select appropriate quality settings
- Check audio source configuration

## File Locations

### Settings
- Windows: `%APPDATA%\sistemagrabacion\settings.json`
- macOS: `~/Library/Application Support/sistemagrabacion/settings.json`
- Linux: `~/.config/sistemagrabacion/settings.json`

### Sessions
- Windows: `%APPDATA%\sistemagrabacion\sessions.json`
- macOS: `~/Library/Application Support/sistemagrabacion/sessions.json`
- Linux: `~/.config/sistemagrabacion/sessions.json`

## Troubleshooting

### No audio captured
- Check Audio Setup - test microphone
- Verify audio source in Settings
- Ensure application has permissions
- Check system audio levels

### Recording stops unexpectedly
- Check disk space
- Verify output path accessibility
- Check system resources (CPU/RAM)
- Review application logs

### Performance issues
- Lower video quality
- Close unnecessary applications
- Check disk I/O performance
- Monitor CPU/RAM usage

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Start/Stop Recording |
| `P` | Pause/Resume |
| `Esc` | Stop Recording |
| `Ctrl+,` | Open Settings |
| `Ctrl+H` | Show History |

## Privacy & Security

- **Screen Recording Notification**: Users are notified when recording
- **Audio Notification**: Microphone indicator shows when in use
- **Data Storage**: All recordings stored locally
- **No Cloud Sync**: Files remain on device
- **Settings**: Only stored locally in app data

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues, feature requests, or questions:
- Create an issue on GitHub
- Check documentation
- Review troubleshooting guide

## Roadmap

- [ ] macOS native support
- [ ] Linux support
- [ ] Custom hotkeys
- [ ] Cloud storage integration
- [ ] Advanced editing tools
- [ ] Streaming capabilities
- [ ] Plugin system
- [ ] Multi-monitor support

## Changelog

### v1.0.0 (Initial Release)
- Basic screen recording
- Audio capture (system + microphone)
- Recording controls (start/pause/stop)
- Session history
- Settings management
- Dark mode support

---

Built with ❤️ using Electron and React
