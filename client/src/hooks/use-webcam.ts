import { useState, useRef, useCallback, useEffect } from 'react';

export function useWebcam() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    setStream(null);
    setIsActive(false);
  }, []);

  const getReadableCameraError = (err: unknown): string => {
    if (!(err instanceof DOMException)) {
      return "Gagal mengakses kamera.";
    }

    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      return "Izin kamera ditolak. Mohon izinkan akses kamera di browser.";
    }

    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      return "Perangkat kamera tidak ditemukan.";
    }

    if (err.name === "NotReadableError" || err.name === "TrackStartError") {
      return "Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain lalu coba lagi.";
    }

    if (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError") {
      return "Mode kamera yang diminta tidak didukung perangkat ini.";
    }

    if (err.name === "SecurityError") {
      return "Akses kamera diblokir karena konteks tidak aman. Gunakan HTTPS.";
    }

    return "Gagal mengakses kamera.";
  };

  const startWebcam = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const unsupportedMessage = "Browser ini tidak mendukung akses kamera.";
      setError(unsupportedMessage);
      throw new Error(unsupportedMessage);
    }

    try {
      setError(null);

      stopWebcam();

      const cameraConstraints: MediaStreamConstraints[] = [
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: { ideal: "user" }
          },
          audio: false
        },
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ];

      let mediaStream: MediaStream | null = null;
      let lastError: unknown = null;

      for (const constraints of cameraConstraints) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!mediaStream) {
        throw lastError ?? new Error("No camera stream available");
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
    } catch (err) {
      const errorMessage = getReadableCameraError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [stopWebcam]);

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

  useEffect(() => {
    return () => {
      stopWebcam();
    };
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
