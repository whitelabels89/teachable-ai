import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTensorFlow } from "@/hooks/use-tensorflow";
import { Upload, Camera, Image as ImageIcon, Trophy, Download, Share2 } from "lucide-react";

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
}

interface PredictionResult {
  className: string;
  confidence: number;
  emoji: string;
}

export default function TestingInterface({ classes }: TestingInterfaceProps) {
  const [testImage, setTestImage] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [topPrediction, setTopPrediction] = useState<PredictionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { predictImage } = useTensorFlow();

  const handleFileUpload = async (files: FileList) => {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setTestImage(imageData);
      await analyzeImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    
    // Simulate prediction analysis
    setTimeout(() => {
      // Generate mock predictions based on classes
      const mockPredictions = classes.map((cls, index) => ({
        className: cls.name,
        confidence: Math.random() * 0.3 + (index === 0 ? 0.65 : 0.05), // First class gets higher confidence
        emoji: getEmojiForClass(cls.name)
      }));
      
      // Sort by confidence
      mockPredictions.sort((a, b) => b.confidence - a.confidence);
      
      setPredictions(mockPredictions);
      setTopPrediction(mockPredictions[0]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getEmojiForClass = (className: string): string => {
    const name = className.toLowerCase();
    if (name.includes('kucing') || name.includes('cat')) return '🐱';
    if (name.includes('anjing') || name.includes('dog')) return '🐶';
    if (name.includes('hewan') || name.includes('animal')) return '🐾';
    if (name.includes('makanan') || name.includes('food')) return '🍎';
    if (name.includes('buah') || name.includes('fruit')) return '🍓';
    if (name.includes('sayur') || name.includes('vegetable')) return '🥕';
    return '📷';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 0.7) return 'bg-success-green';
    if (confidence > 0.4) return 'bg-orange';
    return 'bg-alert-red';
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence > 0.8) return 'Sangat Yakin';
    if (confidence > 0.6) return 'Yakin';
    if (confidence > 0.4) return 'Cukup Yakin';
    return 'Tidak Yakin';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleShareResult = () => {
    // Implementation for sharing results
    console.log('Sharing result:', topPrediction);
  };

  const handleDownloadModel = () => {
    // Implementation for downloading trained model
    console.log('Downloading model...');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-fredoka text-dark-text mb-4">Uji Model AI</h2>
        <p className="text-gray-600 text-lg">Sekarang saatnya melihat seberapa pintar model AI yang kamu buat!</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Test Input */}
        <Card className="bg-gradient-to-br from-google-blue to-purple text-white rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-fredoka">Upload Gambar Test</CardTitle>
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
                  <img
                    src={testImage}
                    alt="Test image"
                    className="max-w-full max-h-48 mx-auto rounded-lg"
                  />
                  <p className="text-sm opacity-75">Klik untuk mengganti gambar</p>
                </div>
              ) : (
                <>
                  <Upload className="text-4xl mb-4 mx-auto" />
                  <p className="text-lg font-bold mb-2">Seret gambar untuk ditest</p>
                  <p className="opacity-75">atau klik untuk memilih file</p>
                </>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
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
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card className="bg-light-gray rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-fredoka text-dark-text">Hasil Prediksi</CardTitle>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-google-blue rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                  <Brain className="text-white text-2xl" />
                </div>
                <p className="text-lg font-bold text-dark-text mb-2">Menganalisis gambar...</p>
                <p className="text-gray-600">AI sedang memproses gambar kamu</p>
              </div>
            ) : predictions.length > 0 ? (
              <div className="space-y-4">
                {/* Top Prediction */}
                {topPrediction && (
                  <div className="p-4 bg-success-green bg-opacity-10 rounded-2xl text-center mb-6">
                    <div className="text-4xl mb-2">{topPrediction.emoji}</div>
                    <h4 className="font-bold text-success-green text-lg mb-2">
                      Prediksi: {topPrediction.className}
                    </h4>
                    <p className="text-gray-600">
                      Model yakin {Math.round(topPrediction.confidence * 100)}% bahwa ini adalah {topPrediction.className.toLowerCase()}
                    </p>
                    <Badge className="mt-2 bg-success-green text-white">
                      {getConfidenceText(topPrediction.confidence)}
                    </Badge>
                  </div>
                )}

                {/* All Predictions */}
                <div className="space-y-3">
                  {predictions.map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
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
                            style={{ width: `${prediction.confidence * 100}%` }}
                          />
                        </div>
                        <span className="font-bold text-sm w-12 text-right">
                          {Math.round(prediction.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 mt-6">
                  <Button
                    onClick={handleShareResult}
                    className="flex-1 bg-google-blue text-white hover:bg-blue-600 transition-colors"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Bagikan Hasil
                  </Button>
                  <Button
                    onClick={handleDownloadModel}
                    className="flex-1 bg-success-green text-white hover:bg-green-600 transition-colors"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Unduh Model
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Upload gambar untuk melihat prediksi</p>
                <p className="text-sm">Model AI siap menganalisis gambar kamu!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
