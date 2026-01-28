import { useRef, useCallback } from 'react';

export const useScreenRecorder = () => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async (sourceId: string) => {
    try {
      // Request screen capture
      const videoStream = await (navigator.mediaDevices as any).getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
          },
        },
      });

      // Request microphone audio
      let audioStream: MediaStream | null = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
          video: false,
        });
      } catch (audioError) {
        console.warn('Could not capture audio:', audioError);
      }

      // Combine video and audio tracks
      const tracks = [...videoStream.getVideoTracks()];
      if (audioStream) {
        tracks.push(...audioStream.getAudioTracks());
      }

      const stream = new MediaStream(tracks);
      streamRef.current = stream;

      // Create MediaRecorder
      const options = { mimeType: 'video/webm; codecs=vp9' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      chunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          
          // Send chunk to main process
          if (window.electronAPI) {
            const arrayBuffer = await event.data.arrayBuffer();
            await window.electronAPI.saveVideoChunk(new Uint8Array(arrayBuffer));
          }
        }
      };

      // Start recording with chunks every 1 second
      mediaRecorder.start(1000);

      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('No active recording'));
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Clean up
        mediaRecorderRef.current = null;
        streamRef.current = null;
        chunksRef.current = [];

        resolve(blob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
  }, []);

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
};
