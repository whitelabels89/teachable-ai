import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { UserCheck, Camera, ArrowLeft, Plus, Trash2, Brain, TestTube, Square } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useWebcam } from "@/hooks/use-webcam";

interface PoseSample {
  id: string;
  features: number[];
  timestamp: number;
  imageData: string;
}

interface PoseClass {
  id: string;
  name: string;
  emoji: string;
  samples: PoseSample[];
  color: string;
}

interface TrainedPoseClass {
  classId: string;
  className: string;
  emoji: string;
  centroid: number[];
}

interface PosePrediction {
  classId: string;
  className: string;
  emoji: string;
  confidence: number;
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const cosineSimilarity = (a: number[], b: number[]) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const aValue = a[i] ?? 0;
    const bValue = b[i] ?? 0;
    dot += aValue * bValue;
    normA += aValue * aValue;
    normB += bValue * bValue;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const computeCentroid = (vectors: number[][]) => {
  if (vectors.length === 0) {
    return [];
  }

  const vectorLength = vectors[0].length;
  const centroid = new Array(vectorLength).fill(0);

  for (const vector of vectors) {
    for (let i = 0; i < vectorLength; i += 1) {
      centroid[i] += vector[i] ?? 0;
    }
  }

  for (let i = 0; i < vectorLength; i += 1) {
    centroid[i] /= vectors.length;
  }

  return centroid;
};

export default function PoseClassifier() {
  const [classes, setClasses] = useState<PoseClass[]>([
    {
      id: "1",
      name: "Tangan Kanan Naik",
      emoji: "🤚",
      samples: [],
      color: "from-purple to-pink-400",
    },
    {
      id: "2",
      name: "Tangan Kiri Naik",
      emoji: "✋",
      samples: [],
      color: "from-google-blue to-blue-600",
    },
  ]);

  const [isCapturing, setIsCapturing] = useState(false);
  const [capturingClassId, setCapturingClassId] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingMessage, setTrainingMessage] = useState("Belum training");
  const [modelTrained, setModelTrained] = useState(false);
  const [trainedClasses, setTrainedClasses] = useState<TrainedPoseClass[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testCountdown, setTestCountdown] = useState(0);
  const [predictions, setPredictions] = useState<PosePrediction[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [newClassEmoji, setNewClassEmoji] = useState("🤸");
  const [captureCount, setCaptureCount] = useState(0);
  const [showAddClass, setShowAddClass] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopCaptureRef = useRef<number | null>(null);
  const testTimeoutRef = useRef<number | null>(null);
  const testCountdownRef = useRef<number | null>(null);
  const captureCountRef = useRef(0);

  const { toast } = useToast();
  const { stream, isActive: webcamActive, error: webcamError, startWebcam, stopWebcam } = useWebcam();

  const colorOptions = [
    "from-purple to-pink-400",
    "from-google-blue to-blue-600",
    "from-success-green to-green-400",
    "from-orange to-yellow-400",
    "from-alert-red to-red-400",
  ];

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {
        // Ignore autoplay block, user interaction button will re-trigger.
      });
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      if (autoStopCaptureRef.current) {
        window.clearTimeout(autoStopCaptureRef.current);
      }
      if (testTimeoutRef.current) {
        window.clearTimeout(testTimeoutRef.current);
      }
      if (testCountdownRef.current) {
        window.clearInterval(testCountdownRef.current);
      }
      stopWebcam();
    };
  }, [stopWebcam]);

  const markModelAsDirty = () => {
    setModelTrained(false);
    setTrainedClasses([]);
    setPredictions([]);
  };

  const addClass = () => {
    if (!newClassName.trim()) {
      return;
    }

    const newClass: PoseClass = {
      id: createId(),
      name: newClassName.trim(),
      emoji: newClassEmoji || "🤸",
      samples: [],
      color: colorOptions[classes.length % colorOptions.length],
    };

    setClasses((prev) => [...prev, newClass]);
    setNewClassName("");
    setNewClassEmoji("🤸");
    setShowAddClass(false);
    markModelAsDirty();

    toast({
      title: "Kelas ditambahkan",
      description: `Kelas "${newClass.name}" siap direkam.`,
    });
  };

  const removeClass = (classId: string) => {
    setClasses((prev) => prev.filter((item) => item.id !== classId));
    markModelAsDirty();
    toast({
      title: "Kelas dihapus",
      description: "Kelas dan sampel pose terkait telah dihapus.",
    });
  };

  const stopAllTimers = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    if (autoStopCaptureRef.current) {
      window.clearTimeout(autoStopCaptureRef.current);
      autoStopCaptureRef.current = null;
    }

    if (testTimeoutRef.current) {
      window.clearTimeout(testTimeoutRef.current);
      testTimeoutRef.current = null;
    }

    if (testCountdownRef.current) {
      window.clearInterval(testCountdownRef.current);
      testCountdownRef.current = null;
    }
  };

  const extractFeaturesFromCanvas = (sourceCanvas: HTMLCanvasElement) => {
    const featureCanvas = document.createElement("canvas");
    const featureSize = 16;
    featureCanvas.width = featureSize;
    featureCanvas.height = featureSize;

    const featureCtx = featureCanvas.getContext("2d");
    if (!featureCtx) {
      throw new Error("Tidak bisa mengambil konteks gambar.");
    }

    featureCtx.drawImage(sourceCanvas, 0, 0, featureSize, featureSize);
    const pixelData = featureCtx.getImageData(0, 0, featureSize, featureSize).data;

    const features: number[] = [];
    for (let i = 0; i < pixelData.length; i += 4) {
      const r = pixelData[i] ?? 0;
      const g = pixelData[i + 1] ?? 0;
      const b = pixelData[i + 2] ?? 0;
      const gray = (r + g + b) / (3 * 255);
      features.push(gray);
    }

    const norm = Math.sqrt(features.reduce((sum, value) => sum + value * value, 0)) || 1;
    return features.map((value) => value / norm);
  };

  const captureCurrentFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    const features = extractFeaturesFromCanvas(canvas);

    return { imageData, features };
  };

  const capturePoseSample = (classId: string) => {
    const frame = captureCurrentFrame();
    if (!frame) {
      return;
    }

    const sample: PoseSample = {
      id: createId(),
      features: frame.features,
      timestamp: Date.now(),
      imageData: frame.imageData,
    };

    setClasses((prev) =>
      prev.map((item) => (item.id === classId ? { ...item, samples: [...item.samples, sample] } : item)),
    );

    captureCountRef.current += 1;
    setCaptureCount(captureCountRef.current);
  };

  const startCamera = async () => {
    try {
      await startWebcam();
      return true;
    } catch (error) {
      toast({
        title: "Gagal menyalakan kamera",
        description: error instanceof Error ? error.message : "Pastikan izin kamera sudah diberikan.",
        variant: "destructive",
      });
      return false;
    }
  };

  const stopCamera = () => {
    stopAllTimers();
    stopWebcam();
    setIsCapturing(false);
    setCapturingClassId(null);
    setCaptureCount(0);
    captureCountRef.current = 0;
    setIsTesting(false);
    setTestCountdown(0);
  };

  const stopCapturing = () => {
    if (!isCapturing) {
      return;
    }

    setIsCapturing(false);
    setCapturingClassId(null);
    stopAllTimers();

    toast({
      title: "Perekaman pose selesai",
      description: `${captureCountRef.current} frame berhasil disimpan.`,
    });

    captureCountRef.current = 0;
    setCaptureCount(0);
  };

  const startCapturing = async (classId: string) => {
    if (!webcamActive) {
      const started = await startCamera();
      if (!started) return;
    }

    stopAllTimers();
    setIsCapturing(true);
    setCapturingClassId(classId);
    setCaptureCount(0);
    captureCountRef.current = 0;

    markModelAsDirty();
    capturePoseSample(classId);

    captureIntervalRef.current = setInterval(() => {
      capturePoseSample(classId);
      if (captureCountRef.current >= 6) {
        stopCapturing();
      }
    }, 800);

    autoStopCaptureRef.current = window.setTimeout(() => {
      stopCapturing();
    }, 5500);

    toast({
      title: "Mulai merekam pose",
      description: "Tahan pose dengan stabil selama beberapa detik.",
    });
  };

  const removeSample = (classId: string, sampleId: string) => {
    setClasses((prev) =>
      prev.map((item) =>
        item.id === classId ? { ...item, samples: item.samples.filter((sample) => sample.id !== sampleId) } : item,
      ),
    );
    markModelAsDirty();
  };

  const trainModel = async () => {
    if (classes.length < 2) {
      toast({
        title: "Kelas belum cukup",
        description: "Minimal 2 kelas diperlukan untuk training.",
        variant: "destructive",
      });
      return;
    }

    if (classes.some((item) => item.samples.length < 3)) {
      toast({
        title: "Sampel belum cukup",
        description: "Setiap kelas minimal harus punya 3 sampel pose.",
        variant: "destructive",
      });
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingMessage("Memproses sampel pose...");

    try {
      const prepared: TrainedPoseClass[] = [];

      for (let i = 0; i < classes.length; i += 1) {
        const poseClass = classes[i];
        const vectors = poseClass.samples.map((sample) => sample.features);

        prepared.push({
          classId: poseClass.id,
          className: poseClass.name,
          emoji: poseClass.emoji,
          centroid: computeCentroid(vectors),
        });

        const stepProgress = Math.round(((i + 1) / classes.length) * 100);
        setTrainingProgress(stepProgress);
        setTrainingMessage(`Mempelajari pola kelas ${poseClass.name}...`);

        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }

      setTrainedClasses(prepared);
      setModelTrained(true);
      setTrainingMessage("Training selesai");

      toast({
        title: "Model gerakan siap",
        description: "Model sudah bisa diuji dengan kamera langsung.",
      });
    } catch (error) {
      setModelTrained(false);
      setTrainedClasses([]);
      toast({
        title: "Training gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat training.",
        variant: "destructive",
      });
    } finally {
      setIsTraining(false);
    }
  };

  const classifyPose = (features: number[]) => {
    const scored = trainedClasses.map((trainedClass) => ({
      ...trainedClass,
      similarity: cosineSimilarity(features, trainedClass.centroid),
    }));

    const expScores = scored.map((item) => Math.exp(item.similarity * 4));
    const sumExp = expScores.reduce((sum, value) => sum + value, 0) || 1;

    return scored
      .map((item, index) => ({
        classId: item.classId,
        className: item.className,
        emoji: item.emoji,
        confidence: expScores[index] / sumExp,
      }))
      .sort((a, b) => b.confidence - a.confidence);
  };

  const testModel = async () => {
    if (!modelTrained || trainedClasses.length === 0) {
      toast({
        title: "Model belum siap",
        description: "Lakukan training terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    if (!webcamActive) {
      const started = await startCamera();
      if (!started) return;
    }

    setIsTesting(true);
    setPredictions([]);
    setTestCountdown(3);

    testCountdownRef.current = window.setInterval(() => {
      setTestCountdown((prev) => {
        if (prev <= 1) {
          if (testCountdownRef.current) {
            window.clearInterval(testCountdownRef.current);
            testCountdownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    testTimeoutRef.current = window.setTimeout(() => {
      const frame = captureCurrentFrame();

      if (!frame) {
        setIsTesting(false);
        toast({
          title: "Pengujian gagal",
          description: "Frame kamera tidak terbaca. Coba lagi.",
          variant: "destructive",
        });
        return;
      }

      const result = classifyPose(frame.features);
      setPredictions(result);
      setIsTesting(false);

      const top = result[0];
      if (top) {
        toast({
          title: "Prediksi selesai",
          description: `${top.emoji} ${top.className} (${Math.round(top.confidence * 100)}%)`,
        });
      }
    }, 3000);
  };

  const totalSamples = classes.reduce((sum, item) => sum + item.samples.length, 0);
  const topPrediction = predictions[0] ?? null;

  return (
    <div className="min-h-screen bg-light-gray py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-800">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-fredoka text-dark-text">Klasifikasi Gerakan</h1>
              <p className="text-gray-600">Latih model dari pose tubuh nyata lewat kamera</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className="bg-success-green text-white">{totalSamples} Sampel</Badge>
            <Badge className="bg-google-blue text-white">{classes.length} Kelas</Badge>
          </div>
        </div>

        <Card className="mb-8 bg-white rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-fredoka text-dark-text">Kamera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                {webcamActive ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <Camera className="h-16 w-16 mb-4 mx-auto opacity-50" />
                      <p className="text-lg">Kamera belum aktif</p>
                    </div>
                  </div>
                )}

                {isCapturing && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                    Menangkap Pose ({captureCount}/6)
                  </div>
                )}

                {isTesting && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="text-white text-6xl font-bold">{testCountdown > 0 ? testCountdown : "GO"}</div>
                  </div>
                )}
              </div>

              {webcamError && <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{webcamError}</div>}

              <div className="flex justify-center space-x-4">
                <Button
                  onClick={webcamActive ? stopCamera : startCamera}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-12 ${
                    webcamActive ? "bg-alert-red text-white hover:bg-red-600" : "bg-success-green text-white hover:bg-green-600"
                  }`}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {webcamActive ? "Matikan Kamera" : "Nyalakan Kamera"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {!showAddClass && (
          <div className="text-center mb-8">
            <Button
              onClick={() => setShowAddClass(true)}
              className="bg-purple text-white hover:bg-purple/80 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-12"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kelas Baru
            </Button>
          </div>
        )}

        {showAddClass && (
          <Card className="mb-8 bg-white rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-fredoka text-dark-text">Tambah Kelas Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <Label htmlFor="className">Nama Kelas</Label>
                  <Input
                    id="className"
                    placeholder="Contoh: Pose T, Dua Tangan Naik"
                    value={newClassName}
                    onChange={(event) => setNewClassName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        addClass();
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="classEmoji">Emoji</Label>
                  <Input
                    id="classEmoji"
                    className="w-20 text-center"
                    value={newClassEmoji}
                    onChange={(event) => setNewClassEmoji(event.target.value)}
                  />
                </div>
                <Button
                  onClick={addClass}
                  disabled={!newClassName.trim()}
                  className="bg-success-green text-white hover:bg-green-600 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-12"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah
                </Button>
                <Button variant="outline" onClick={() => setShowAddClass(false)} className="px-6 py-3 rounded-xl font-semibold h-12">
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {classes.map((poseClass) => (
            <Card key={poseClass.id} className={`bg-gradient-to-br ${poseClass.color} text-white rounded-3xl shadow-xl`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{poseClass.emoji}</div>
                    <div>
                      <CardTitle className="text-2xl font-fredoka">{poseClass.name}</CardTitle>
                      <Badge className="bg-white text-gray-800 font-bold w-fit">{poseClass.samples.length} pose</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeClass(poseClass.id)} className="text-white hover:bg-white/20">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-4 border-dashed border-white rounded-2xl p-8 text-center">
                    {isCapturing && capturingClassId === poseClass.id ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                          <span className="text-lg font-bold">Menangkap Pose</span>
                        </div>
                        <div className="text-2xl font-bold">{captureCount}/6</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <UserCheck className="h-10 w-10 mx-auto" />
                        <div>
                          <p className="text-lg font-bold mb-2">Rekam pose {poseClass.name.toLowerCase()}</p>
                          <p className="opacity-75">Tahan pose 4-6 detik untuk hasil stabil</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    {isCapturing && capturingClassId === poseClass.id ? (
                      <Button
                        onClick={stopCapturing}
                        className="flex-1 bg-alert-red text-white hover:bg-red-600 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-12"
                      >
                        <Square className="mr-2 h-4 w-4" />
                        Berhenti
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          startCapturing(poseClass.id).catch(() => {
                            toast({
                              title: "Perekaman gagal",
                              description: "Tidak bisa memulai perekaman pose.",
                              variant: "destructive",
                            });
                          });
                        }}
                        disabled={isCapturing || !webcamActive || isTraining || isTesting}
                        className="flex-1 bg-white text-gray-800 hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-12"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Rekam Gerakan
                      </Button>
                    )}
                  </div>

                  {poseClass.samples.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-white">Pose Tersimpan:</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {poseClass.samples.slice(0, 6).map((sample, index) => (
                          <div key={sample.id} className="relative group">
                            <img src={sample.imageData} alt={`Pose ${index + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSample(poseClass.id, sample.id)}
                              className="absolute top-1 right-1 text-white bg-black/50 hover:bg-black/70 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      {poseClass.samples.length > 6 && <p className="text-sm text-white/80">+{poseClass.samples.length - 6} pose lainnya</p>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {totalSamples > 0 && (
          <Card className="mb-8 bg-white rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-fredoka text-dark-text">Latih Model Gerakan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isTraining ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Brain className="h-6 w-6 text-google-blue animate-pulse" />
                      <span className="text-lg font-medium">{trainingMessage}</span>
                    </div>
                    <Progress value={trainingProgress} className="h-3" />
                    <p className="text-sm text-gray-600 text-center">{trainingProgress}% selesai</p>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <Button
                      onClick={() => {
                        trainModel().catch(() => {
                          toast({
                            title: "Training gagal",
                            description: "Terjadi kesalahan tak terduga.",
                            variant: "destructive",
                          });
                        });
                      }}
                      disabled={classes.length < 2 || classes.some((item) => item.samples.length < 3)}
                      className="bg-success-green text-white hover:bg-green-600 px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-14"
                    >
                      <Brain className="mr-2 h-5 w-5" />
                      Latih Model AI
                    </Button>
                    {modelTrained && <Badge className="bg-success-green text-white">Model Sudah Dilatih</Badge>}
                    <p className="text-sm text-gray-600">
                      {classes.length < 2 && "Minimal 2 kelas diperlukan"}
                      {classes.length >= 2 && classes.some((item) => item.samples.length < 3) && "Setiap kelas butuh minimal 3 sampel pose"}
                      {classes.length >= 2 && !classes.some((item) => item.samples.length < 3) && "Model akan membandingkan pola visual antar pose"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {modelTrained && (
          <Card className="bg-white rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-fredoka text-dark-text">Uji Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <p className="text-gray-600">Klik tombol di bawah untuk menguji model dengan pose baru (3 detik)</p>

                <Button
                  onClick={() => {
                    testModel().catch(() => {
                      toast({
                        title: "Pengujian gagal",
                        description: "Terjadi kesalahan tak terduga.",
                        variant: "destructive",
                      });
                    });
                  }}
                  disabled={isTesting || !webcamActive || isTraining}
                  className="bg-orange text-white hover:bg-orange/80 px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-14"
                >
                  <TestTube className="mr-2 h-5 w-5" />
                  {isTesting ? "Menganalisis..." : "Uji Model"}
                </Button>

                {!webcamActive && <p className="text-sm text-gray-500">Nyalakan kamera terlebih dahulu untuk pengujian model.</p>}

                {topPrediction && (
                  <div className="space-y-4">
                    <div className="bg-success-green/10 rounded-2xl p-6">
                      <h3 className="text-lg font-fredoka text-dark-text mb-2">Hasil Utama:</h3>
                      <div className="text-3xl font-bold text-success-green">
                        {topPrediction.emoji} {topPrediction.className} ({Math.round(topPrediction.confidence * 100)}%)
                      </div>
                    </div>

                    <div className="space-y-3">
                      {predictions.map((prediction) => (
                        <div key={prediction.classId} className="bg-gray-50 rounded-xl p-4 text-left">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-dark-text">
                              {prediction.emoji} {prediction.className}
                            </span>
                            <span className="font-bold text-google-blue">{Math.round(prediction.confidence * 100)}%</span>
                          </div>
                          <Progress value={prediction.confidence * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {totalSamples === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🤸‍♂️</div>
            <h2 className="text-2xl font-fredoka text-dark-text mb-4">Mulai Proyek Klasifikasi Gerakan</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Nyalakan kamera, rekam pose untuk tiap kelas, lalu latih model. Sistem akan mengenali pola pose dari data visual yang dikumpulkan.
            </p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
