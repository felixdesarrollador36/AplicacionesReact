# Copilot Instructions for Sistema de Grabación

This file provides context and guidelines for AI coding assistants working on the Sistema de Grabación project.

## Project Overview

**Sistema de Grabación** is a desktop screen and audio recording application built with Electron and React. The application allows users to record their screen and audio from applications like Microsoft Teams and Google Meet.

### Technology Stack
- **Frontend**: React 18 with TypeScript and Tailwind CSS
- **Desktop Framework**: Electron 27
- **State Management**: Zustand
- **Build Tool**: Vite
- **Icons**: Lucide React

## Project Structure

```
sistemagrabacion/
├── src/                          # React frontend code
│   ├── components/               # Reusable React components
│   │   ├── RecordingControls.tsx    # Recording controls UI
│   │   ├── SettingsPanel.tsx        # Settings modal
│   │   ├── SessionHistory.tsx       # Recording history
│   │   ├── AudioSetup.tsx           # Audio configuration
│   │   ├── Dashboard.tsx            # Main dashboard layout
│   │   └── Tabs.tsx                 # Custom tabs component
│   ├── pages/                    # Page-level components (future)
│   ├── services/                 # API/business logic services
│   ├── store/                    # Zustand state stores
│   │   └── recording.ts          # Recording, settings, and session stores
│   ├── types/                    # TypeScript type definitions
│   │   ├── recording.ts          # Recording domain types
│   │   └── electron.ts           # Electron API types
│   ├── utils/                    # Helper utilities
│   │   ├── formatting.ts         # Format functions (duration, filesize)
│   │   └── errors.ts             # Custom error classes
│   ├── index.tsx                 # React entry point
│   └── index.css                 # Global styles with Tailwind
├── electron/                     # Electron main process code
│   ├── main/                     # Main process
│   │   ├── index.ts              # Electron app setup and IPC handlers
│   │   └── recording-manager.ts  # Recording logic and state
│   └── preload/                  # Preload scripts
│       └── index.ts              # Context bridge for IPC
├── public/                       # Static assets
│   └── index.html                # HTML template
├── dist/                         # Build output (generated)
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
└── README.md                     # Project documentation
```

## Key Concepts

### Architecture Pattern
- **MVVM-inspired**: Zustand stores act as view models
- **Component-driven**: UI built from composable React components
- **Type-safe**: Comprehensive TypeScript throughout

### State Management
All state is managed through Zustand stores in `src/store/recording.ts`:
- `useRecordingStore`: Active recording state (isRecording, isPaused, duration, etc.)
- `useSettingsStore`: User preferences and app configuration
- `useSessionStore`: Recording history and past sessions

### IPC Communication (Electron Bridge)
The `window.electronAPI` object provides async methods to communicate with the Electron main process:
- `startRecording()`, `stopRecording()`, `pauseRecording()`, `resumeRecording()`
- `getDisplaySources()`, `selectOutputPath()`, `openFile()`
- `getAudioDevices()`, `testMicrophone()`
- `getSessions()`, `deleteSession()`
- `saveSettings()`, `loadSettings()`

Event listeners:
- `onRecordingTick()` - Updates duration every 100ms during recording
- `onRecordingError()` - Notifies on recording errors
- `onRecordingComplete()` - Notifies when recording finishes

## Development Workflow

### Getting Started
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (React + Electron)
```

### Development Commands
- `npm run dev:react` - Start React dev server only (http://localhost:3000)
- `npm run dev:electron` - Start Electron only
- `npm run build` - Build for production
- `npm run package` - Create installers

### Hot Reloading
- React changes reload automatically via Vite HMR
- Electron main process requires manual restart

## Coding Guidelines

### Component Development
1. Use functional components with hooks
2. Implement proper TypeScript types
3. Keep components focused and composable
4. Use Zustand hooks for state
5. Apply Tailwind classes for styling
6. Support dark mode with `dark:` prefix

Example component structure:
```tsx
interface ComponentProps {
  onAction: () => void;
}

export const MyComponent: React.FC<ComponentProps> = ({ onAction }) => {
  const { state, setState } = useRecordingStore();
  
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
};
```

### State Management
Use Zustand stores for all shared state. Avoid prop drilling. Example:
```tsx
const { isRecording, setRecording } = useRecordingStore();
```

### IPC Communication
Always wrap IPC calls in try-catch and handle errors:
```tsx
try {
  await window.electronAPI.startRecording(settings);
} catch (error) {
  setError((error as Error).message);
}
```

### File Organization
- One component per file
- Exports at end of file
- Use absolute imports via path aliases (@/)
- Keep utilities in separate files

## Common Tasks

### Adding a New Recording Setting
1. Add type to `src/types/recording.ts` (AppSettings interface)
2. Add UI control in `src/components/SettingsPanel.tsx`
3. Add store method in `src/store/recording.ts`
4. Handle in Electron in `electron/main/recording-manager.ts`

### Adding an IPC Handler
1. Add method to `RecordingManager` class in `electron/main/recording-manager.ts`
2. Register handler in `electron/main/index.ts` with `ipcMain.handle()`
3. Add method to `ElectronAPI` interface in `src/types/electron.ts`
4. Add method to preload bridge in `electron/preload/index.ts`

### Adding a Component
1. Create `.tsx` file in `src/components/`
2. Define props interface
3. Export as named export
4. Import in Dashboard or parent component
5. Add styling with Tailwind

## Important Files to Know

| File | Purpose |
|------|---------|
| `src/store/recording.ts` | Central state management |
| `src/components/Dashboard.tsx` | Main UI orchestration |
| `electron/main/index.ts` | App setup and IPC routing |
| `src/types/electron.ts` | Electron bridge contract |
| `vite.config.ts` | Build configuration |

## Build and Packaging

### Development Build
```bash
npm run build:react    # Build React to dist/react/
npm run build:electron # Build Electron to dist/
```

### Creating Installers
```bash
npm run package        # Creates .exe, .msi, etc. (Windows)
```

## Debugging

### React DevTools
- Press `F12` in dev mode to open DevTools
- Use React DevTools extension to inspect components

### Electron Debugging
- Check console in DevTools for main process logs
- Review IPC communication in DevTools console
- Use `console.log()` in main process

## Important Notes

- **Node Integration**: Disabled for security (use IPC instead)
- **Sandbox**: Enabled in BrowserWindow
- **Context Isolation**: Enabled (use preload bridge)
- **File Paths**: Use absolute paths with proper path resolution
- **Settings Storage**: Persisted to `%APPDATA%/sistemagrabacion/`

## Testing

Currently using Vitest for testing setup (configured but not implemented).

To add tests:
```bash
npm run test           # Run tests
npm run test:watch    # Watch mode
```

## Performance Considerations

- Recording duration updated every 100ms (can be optimized)
- UI components memoized where appropriate
- State updates batched in Zustand
- Large file lists paginated in SessionHistory

## Known Limitations & Future Work

- Microphone test returns static result (needs real implementation)
- Recording actually saves to temp directory (needs real file writing)
- No actual MediaRecorder integration yet (needs implementation)
- Settings don't fully persist to disk yet
- Session data structure needs database integration

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## Questions or Issues?

When encountering issues, check:
1. TypeScript compilation errors
2. IPC handler registration
3. File paths and permissions
4. React component lifecycle
5. Electron security context

---

Last Updated: January 2026
