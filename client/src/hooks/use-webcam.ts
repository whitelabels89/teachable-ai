import { useState, useRef, useCallback } from 'react';

export function useWebcam() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startWebcam = useCallback(async () => {
    try {
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access webcam';
      setError(errorMessage);
      console.error('Error accessing webcam:', err);
      throw err;
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
      setIsActive(false);
    }
  }, []);

  const captureFrame = useCallback((videoElement: HTMLVideoElement): string => {
    if (!videoElement) {
      throw new Error('Video element not provided');
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not get canvas context');
    }

    // Set canvas size to match video
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(videoElement, 0, 0);

    // Convert to base64 image data
    return canvas.toDataURL('image/png');
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    stopWebcam();
  }, [stopWebcam]);

  return {
    stream,
    isActive,
    error,
    startWebcam,
    stopWebcam,
    captureFrame,
    cleanup
  };
}
