import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebcam } from "@/hooks/use-webcam";
import { Camera, Video, VideoOff, X } from "lucide-react";

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export default function WebcamCapture({ onCapture, onClose }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const { stream, isActive, error, startWebcam, stopWebcam } = useWebcam();

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  const handleStartWebcam = async () => {
    try {
      await startWebcam();
    } catch (error) {
      console.error('Failed to start webcam:', error);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) return;

    // Start countdown
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          captureImage();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/png');
    
    setCapturedImages(prev => [...prev, imageData]);
    onCapture(imageData);
  };

  const handleStopWebcam = () => {
    stopWebcam();
    setCapturedImages([]);
  };

  const handleClose = () => {
    handleStopWebcam();
    onClose();
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-fredoka text-google-blue">
            Ambil Foto dengan Webcam
          </CardTitle>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-gray-600">Bersiaplah untuk mengambil foto yang bagus!</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Video Display */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Canvas for capture */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Webcam overlay */}
            {isActive && (
              <div className="webcam-overlay" />
            )}
            
            {/* Countdown overlay */}
            {countdown && (
              <div className="capture-countdown">
                {countdown}
              </div>
            )}
            
            {/* No webcam message */}
            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-center">
                <div>
                  <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl opacity-75">Webcam akan muncul di sini</p>
                  <p className="text-sm opacity-50 mt-2">Klik "Nyalakan Kamera" untuk memulai</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {!isActive ? (
              <Button
                onClick={handleStartWebcam}
                className="bg-google-blue text-white px-8 py-4 rounded-full font-bold hover:bg-blue-600 transition-all transform hover:scale-105"
              >
                <Video className="mr-2 h-4 w-4" />
                Nyalakan Kamera
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleCapture}
                  className="bg-success-green text-white px-8 py-4 rounded-full font-bold hover:bg-green-600 transition-all transform hover:scale-105"
                  disabled={countdown !== null}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Ambil Foto
                </Button>
                <Button
                  onClick={handleStopWebcam}
                  className="bg-gray-500 text-white px-8 py-4 rounded-full font-bold hover:bg-gray-600 transition-all transform hover:scale-105"
                >
                  <VideoOff className="mr-2 h-4 w-4" />
                  Matikan Kamera
                </Button>
              </>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Captured Images Preview */}
          {capturedImages.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-dark-text mb-4">Foto yang Diambil</h3>
              <div className="grid grid-cols-4 gap-4">
                {capturedImages.map((image, index) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`Captured ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 4 - capturedImages.length) }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border-2 border-dashed">
                    <Camera className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
