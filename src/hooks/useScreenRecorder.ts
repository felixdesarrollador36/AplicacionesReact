import { useRef, useCallback } from 'react';

interface StartRecordingOptions {
  cameraEnabled?: boolean;
}

export const useScreenRecorder = () => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const compositedStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewVideosRef = useRef<{ screen: HTMLVideoElement | null; camera: HTMLVideoElement | null }>({
    screen: null,
    camera: null,
  });
  const chunksRef = useRef<Blob[]>([]);

  const cleanupCompositeResources = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (compositedStreamRef.current) {
      compositedStreamRef.current.getTracks().forEach((track) => track.stop());
      compositedStreamRef.current = null;
    }

    if (previewVideosRef.current.screen) {
      previewVideosRef.current.screen.pause();
      previewVideosRef.current.screen.srcObject = null;
      previewVideosRef.current.screen = null;
    }

    if (previewVideosRef.current.camera) {
      previewVideosRef.current.camera.pause();
      previewVideosRef.current.camera.srcObject = null;
      previewVideosRef.current.camera = null;
    }

    compositeCanvasRef.current = null;
  }, []);

  const startRecording = useCallback(async (sourceId: string, options: StartRecordingOptions = {}) => {
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
      screenStreamRef.current = videoStream;

      let videoTrack = videoStream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error('No video track available from screen capture');
      }

      if (options.cameraEnabled) {
        try {
          const cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 360 },
              frameRate: { ideal: 30 },
            },
            audio: false,
          });
          cameraStreamRef.current = cameraStream;

          const cameraTrack = cameraStream.getVideoTracks()[0];
          if (cameraTrack) {
            const screenVideo = document.createElement('video');
            screenVideo.srcObject = videoStream;
            screenVideo.muted = true;
            screenVideo.playsInline = true;

            const cameraVideo = document.createElement('video');
            cameraVideo.srcObject = cameraStream;
            cameraVideo.muted = true;
            cameraVideo.playsInline = true;

            await Promise.all([
              screenVideo.play().catch(() => undefined),
              cameraVideo.play().catch(() => undefined),
            ]);

            const screenSettings = videoTrack.getSettings();
            const canvas = document.createElement('canvas');
            canvas.width = screenSettings.width || 1920;
            canvas.height = screenSettings.height || 1080;

            const context = canvas.getContext('2d');
            if (!context) {
              throw new Error('Could not initialize video compositor');
            }

            const drawFrame = () => {
              context.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

              const cameraWidth = Math.floor(canvas.width * 0.24);
              const cameraHeight = Math.floor(cameraWidth * 9 / 16);
              const margin = Math.floor(canvas.width * 0.02);
              const x = canvas.width - cameraWidth - margin;
              const y = canvas.height - cameraHeight - margin;

              context.fillStyle = 'rgba(0, 0, 0, 0.35)';
              context.fillRect(x - 6, y - 6, cameraWidth + 12, cameraHeight + 12);
              context.drawImage(cameraVideo, x, y, cameraWidth, cameraHeight);

              animationFrameRef.current = requestAnimationFrame(drawFrame);
            };

            drawFrame();

            const compositedStream = canvas.captureStream(30);
            const compositedTrack = compositedStream.getVideoTracks()[0];

            if (compositedTrack) {
              videoTrack = compositedTrack;
              compositedStreamRef.current = compositedStream;
              compositeCanvasRef.current = canvas;
              previewVideosRef.current = { screen: screenVideo, camera: cameraVideo };
            }
          }
        } catch (cameraError) {
          console.warn('Could not capture camera overlay, using screen-only recording:', cameraError);
        }
      }

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
        audioStreamRef.current = audioStream;
      } catch (audioError) {
        console.warn('Could not capture audio:', audioError);
      }

      // Combine video and audio tracks
      const tracks = [videoTrack];
      if (audioStream) {
        tracks.push(...audioStream.getAudioTracks());
      }

      const stream = new MediaStream(tracks);
      streamRef.current = stream;

      // Create MediaRecorder
      const recorderOptions = { mimeType: 'video/webm; codecs=vp9' };
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
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
      cleanupCompositeResources();
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      console.error('Error starting recording:', error);
      throw error;
    }
  }, [cleanupCompositeResources]);

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
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        cleanupCompositeResources();

        // Clean up
        mediaRecorderRef.current = null;
        streamRef.current = null;
        screenStreamRef.current = null;
        audioStreamRef.current = null;
        cameraStreamRef.current = null;
        chunksRef.current = [];

        resolve(blob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [cleanupCompositeResources]);

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
