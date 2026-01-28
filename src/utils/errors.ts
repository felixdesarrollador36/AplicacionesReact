export class RecordingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RecordingError';
  }
}

export class NoPermissionError extends RecordingError {
  constructor(message = 'Permission denied') {
    super(message, 'NO_PERMISSION');
  }
}

export class NoAudioDeviceError extends RecordingError {
  constructor(message = 'No audio device available') {
    super(message, 'NO_AUDIO_DEVICE');
  }
}

export class InvalidPathError extends RecordingError {
  constructor(message = 'Invalid output path') {
    super(message, 'INVALID_PATH');
  }
}

export const handleRecordingError = (error: unknown): { message: string; code: string } => {
  if (error instanceof RecordingError) {
    return { message: error.message, code: error.code };
  }
  if (error instanceof Error) {
    return { message: error.message, code: 'UNKNOWN_ERROR' };
  }
  return { message: 'An unknown error occurred', code: 'UNKNOWN_ERROR' };
};
