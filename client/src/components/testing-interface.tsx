import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, Image as ImageIcon, Trophy, Download, Share2, Brain } from "lucide-react";
import WebcamCapture from "@/components/webcam-capture";
import { useToast } from "@/hooks/use-toast";
import type { PredictionResult } from "@/hooks/use-tensorflow";

interface TestingInterfaceProps {
  classes: Array<{
    id: string;
    name: string;
    samples: Array<{
      id: string | number;
      data: string;
      type: string;
      timestamp: number;
    }>;
  }>;
  isModelReady: boolean;
  isProcessing: boolean;
  onPredict: (imageData: string) => Promise<PredictionResult[]>;
  onDownloadModel: () => Promise<void>;
}

interface DisplayPrediction {
  className: string;
  confidence: number;
  emoji: string;
}

export default function TestingInterface({
  classes,
  isModelReady,
  isProcessing,
  onPredict,
  onDownloadModel,
}: TestingInterfaceProps) {
  const [testImage, setTestImage] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<DisplayPrediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [topPrediction, setTopPrediction] = useState<DisplayPrediction | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (files: FileList) => {
    const file = files[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      setTestImage(imageData);
      await analyzeImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (imageData: string) => {
    if (!isModelReady) {
      setAnalysisError("Model belum siap. Silakan latih model terlebih dahulu.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const rawPredictions = await onPredict(imageData);
      const mappedPredictions = rawPredictions.map((prediction) => ({
        className: prediction.label,
        confidence: prediction.confidence,
        emoji: getEmojiForClass(prediction.label),
      }));

      setPredictions(mappedPredictions);
      setTopPrediction(mappedPredictions[0] ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menganalisis gambar.";
      setAnalysisError(message);
      setPredictions([]);
      setTopPrediction(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getEmojiForClass = (className: string): string => {
    const name = className.toLowerCase();
    if (name.includes("kucing") || name.includes("cat")) return "🐱";
    if (name.includes("anjing") || name.includes("dog")) return "🐶";
    if (name.includes("hewan") || name.includes("animal")) return "🐾";
    if (name.includes("makanan") || name.includes("food")) return "🍎";
    if (name.includes("buah") || name.includes("fruit")) return "🍓";
    if (name.includes("sayur") || name.includes("vegetable")) return "🥕";
    return "📷";
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 0.7) return "bg-success-green";
    if (confidence > 0.4) return "bg-orange";
    return "bg-alert-red";
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence > 0.8) return "Sangat Yakin";
    if (confidence > 0.6) return "Yakin";
    if (confidence > 0.4) return "Cukup Yakin";
    return "Perlu Data Tambahan";
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files).catch(() => {
        setAnalysisError("Gagal memproses file gambar.");
      });
    }
  };

  const handleShareResult = async () => {
    if (!topPrediction) {
      return;
    }

    const shareText = `Hasil model Teachable AI: ${topPrediction.className} (${Math.round(topPrediction.confidence * 100)}%).`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Hasil Model Teachable AI",
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Hasil disalin",
          description: "Teks hasil prediksi sudah masuk clipboard.",
        });
      }
    } catch {
      toast({
        title: "Gagal membagikan",
        description: "Silakan coba lagi atau bagikan manual.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadModel = async () => {
    try {
      await onDownloadModel();
      toast({
        title: "Model diunduh",
        description: "File model dan label berhasil diunduh.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengunduh model.";
      toast({
        title: "Unduh gagal",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleWebcamCapture = async (imageData: string) => {
    setShowWebcam(false);
    setTestImage(imageData);
    await analyzeImage(imageData);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-fredoka text-dark-text mb-4">Uji Model AI</h2>
        <p className="text-gray-600 text-lg">Sekarang saatnya melihat seberapa pintar model AI yang sudah dilatih!</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-gradient-to-br from-google-blue to-purple text-white rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-fredoka">Gambar Uji</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-4 border-dashed border-white rounded-2xl p-8 text-center mb-6 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {testImage ? (
                <div className="space-y-4">
                  <img src={testImage} alt="Test" className="max-w-full max-h-48 mx-auto rounded-lg" />
                  <p className="text-sm opacity-75">Klik untuk mengganti gambar</p>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mb-4 mx-auto" />
                  <p className="text-lg font-bold mb-2">Seret gambar untuk diuji</p>
                  <p className="opacity-75">atau klik untuk memilih file</p>
                </>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={() => setShowWebcam(true)}
                className="flex-1 bg-white text-google-blue hover:bg-opacity-90 transition-all"
              >
                <Camera className="mr-2 h-4 w-4" />
                Ambil Foto
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-white text-google-blue hover:bg-opacity-90 transition-all"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Pilih File
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => event.target.files && handleFileUpload(event.target.files)}
              className="hidden"
            />

            {!isModelReady && (
              <p className="mt-4 text-sm text-white/90">Model belum tersedia. Selesaikan training dulu.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-light-gray rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-fredoka text-dark-text">Hasil Prediksi</CardTitle>
          </CardHeader>
          <CardContent>
            {isAnalyzing || isProcessing ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-google-blue rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                  <Brain className="text-white h-8 w-8" />
                </div>
                <p className="text-lg font-bold text-dark-text mb-2">Menganalisis gambar...</p>
                <p className="text-gray-600">AI sedang memproses gambar kamu</p>
              </div>
            ) : analysisError ? (
              <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700 text-sm">{analysisError}</div>
            ) : predictions.length > 0 ? (
              <div className="space-y-4">
                {topPrediction && (
                  <div className="p-4 bg-success-green bg-opacity-10 rounded-2xl text-center mb-6">
                    <div className="text-4xl mb-2">{topPrediction.emoji}</div>
                    <h4 className="font-bold text-success-green text-lg mb-2">Prediksi: {topPrediction.className}</h4>
                    <p className="text-gray-600">
                      Model yakin {Math.round(topPrediction.confidence * 100)}% bahwa ini adalah {topPrediction.className.toLowerCase()}
                    </p>
                    <Badge className="mt-2 bg-success-green text-white">{getConfidenceText(topPrediction.confidence)}</Badge>
                  </div>
                )}

                <div className="space-y-3">
                  {predictions.map((prediction, index) => (
                    <div key={`${prediction.className}-${index}`} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">{prediction.emoji}</span>
                        </div>
                        <span className="font-bold text-dark-text">{prediction.className}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-3">
                          <div
                            className={`${getConfidenceColor(prediction.confidence)} h-3 rounded-full transition-all`}
                            style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-sm w-12 text-right">{Math.round(prediction.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4 mt-6">
                  <Button onClick={handleShareResult} className="flex-1 bg-google-blue text-white hover:bg-blue-600 transition-colors">
                    <Share2 className="mr-2 h-4 w-4" />
                    Bagikan Hasil
                  </Button>
                  <Button onClick={handleDownloadModel} className="flex-1 bg-success-green text-white hover:bg-green-600 transition-colors">
                    <Download className="mr-2 h-4 w-4" />
                    Unduh Model
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Upload atau ambil foto untuk melihat prediksi</p>
                <p className="text-sm">Kelas aktif: {classes.length}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showWebcam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full mx-4">
            <WebcamCapture onCapture={handleWebcamCapture} onClose={() => setShowWebcam(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
