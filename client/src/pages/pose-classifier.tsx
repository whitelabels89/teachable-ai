import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { UserCheck, Camera, Play, Users, ArrowLeft, Plus, Trash2, Brain, TestTube, Video, Square } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface PoseSample {
  id: string;
  keypoints: any[]; // Pose keypoints from PoseNet
  timestamp: number;
  imageData: string; // base64 encoded image
}

interface PoseClass {
  id: string;
  name: string;
  emoji: string;
  samples: PoseSample[];
  color: string;
}

export default function PoseClassifier() {
  const [classes, setClasses] = useState<PoseClass[]>([
    {
      id: "1",
      name: "Tangan Kanan Naik",
      emoji: "🤚",
      samples: [],
      color: "from-purple to-pink-400"
    },
    {
      id: "2", 
      name: "Tangan Kiri Naik",
      emoji: "✋",
      samples: [],
      color: "from-google-blue to-blue-600"
    }
  ]);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturingClassId, setCapturingClassId] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [modelTrained, setModelTrained] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newClassEmoji, setNewClassEmoji] = useState("🤸");
  const [captureCount, setCaptureCount] = useState(0);
  const [showAddClass, setShowAddClass] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const colorOptions = [
    "from-purple to-pink-400",
    "from-google-blue to-blue-600", 
    "from-success-green to-green-400",
    "from-orange to-yellow-400",
    "from-alert-red to-red-400"
  ];

  // Initialize webcam
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setWebcamActive(true);
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      toast({
        title: "Error",
        description: "Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.",
        variant: "destructive"
      });
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setWebcamActive(false);
    setIsCapturing(false);
    setCapturingClassId(null);
  };

  const addClass = () => {
    if (!newClassName.trim()) return;
    
    const newClass: PoseClass = {
      id: Date.now().toString(),
      name: newClassName.trim(),
      emoji: newClassEmoji,
      samples: [],
      color: colorOptions[classes.length % colorOptions.length]
    };
    
    setClasses(prev => [...prev, newClass]);
    setNewClassName("");
    setNewClassEmoji("🤸");
    setShowAddClass(false);
    
    toast({
      title: "Kelas berhasil ditambahkan!",
      description: `Kelas "${newClass.name}" siap untuk dilatih`
    });
  };

  const removeClass = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
    toast({
      title: "Kelas dihapus",
      description: "Kelas dan semua sampel pose telah dihapus"
    });
  };

  const startCapturing = async (classId: string) => {
    if (!webcamActive) {
      await startWebcam();
    }
    
    setIsCapturing(true);
    setCapturingClassId(classId);
    setCaptureCount(0);
    
    // Simulate pose detection and capture
    intervalRef.current = setInterval(() => {
      capturePose(classId);
    }, 1000); // Capture every second
    
    toast({
      title: "Mulai menangkap pose",
      description: "Lakukan gerakan yang konsisten selama 5 detik"
    });
    
    // Auto stop after 5 seconds
    setTimeout(() => {
      stopCapturing();
    }, 5000);
  };

  const stopCapturing = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsCapturing(false);
    setCapturingClassId(null);
    setCaptureCount(0);
    
    toast({
      title: "Penangkapan pose selesai",
      description: "Pose berhasil disimpan"
    });
  };

  const capturePose = (classId: string) => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Simulate pose keypoints (in a real app, this would come from PoseNet)
    const mockKeypoints = generateMockKeypoints(classId);
    
    const sample: PoseSample = {
      id: Date.now().toString() + Math.random(),
      keypoints: mockKeypoints,
      timestamp: Date.now(),
      imageData
    };
    
    setClasses(prev => prev.map(c => 
      c.id === classId 
        ? { ...c, samples: [...c.samples, sample] }
        : c
    ));
    
    setCaptureCount(prev => prev + 1);
  };

  // Generate mock pose keypoints for demonstration
  const generateMockKeypoints = (classId: string) => {
    const baseKeypoints = [];
    for (let i = 0; i < 17; i++) { // PoseNet has 17 keypoints
      baseKeypoints.push({
        score: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
        part: `keypoint_${i}`,
        position: {
          x: Math.random() * 640,
          y: Math.random() * 480
        }
      });
    }
    
    // Modify keypoints based on class to create variation
    if (classId === "1") { // Right hand up
      baseKeypoints[10] = { // Right wrist
        score: 0.9,
        part: "rightWrist",
        position: { x: 400, y: 150 }
      };
    } else if (classId === "2") { // Left hand up
      baseKeypoints[9] = { // Left wrist
        score: 0.9,
        part: "leftWrist", 
        position: { x: 240, y: 150 }
      };
    }
    
    return baseKeypoints;
  };

  const removeSample = (classId: string, sampleId: string) => {
    setClasses(prev => prev.map(c => 
      c.id === classId 
        ? { ...c, samples: c.samples.filter(s => s.id !== sampleId) }
        : c
    ));
  };

  const trainModel = async () => {
    if (classes.length < 2) {
      toast({
        title: "Tidak cukup kelas",
        description: "Minimal 2 kelas diperlukan untuk melatih model",
        variant: "destructive"
      });
      return;
    }

    const hasEnoughSamples = classes.every(c => c.samples.length >= 3);
    if (!hasEnoughSamples) {
      toast({
        title: "Tidak cukup sampel",
        description: "Setiap kelas minimal membutuhkan 3 sampel pose",
        variant: "destructive"
      });
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    setModelTrained(false);

    // Simulate training process
    const steps = [
      { progress: 15, message: "Memproses keypoints..." },
      { progress: 35, message: "Ekstraksi fitur pose..." },
      { progress: 55, message: "Inisialisasi model..." },
      { progress: 75, message: "Pelatihan neural network..." },
      { progress: 90, message: "Validasi model..." },
      { progress: 100, message: "Pelatihan selesai!" }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTrainingProgress(step.progress);
    }

    setIsTraining(false);
    setModelTrained(true);
    toast({
      title: "Model berhasil dilatih!",
      description: "Sekarang Anda dapat menguji model dengan pose baru"
    });
  };

  const testModel = async () => {
    if (!modelTrained) {
      toast({
        title: "Model belum dilatih",
        description: "Latih model terlebih dahulu sebelum menguji",
        variant: "destructive"
      });
      return;
    }

    if (!webcamActive) {
      await startWebcam();
    }

    setIsTesting(true);
    setTestResult(null);
    
    toast({
      title: "Menguji model...",
      description: "Lakukan pose selama 3 detik"
    });

    // Simulate testing for 3 seconds
    setTimeout(() => {
      // Simulate prediction
      const availableClasses = classes.filter(c => c.samples.length > 0);
      const randomClass = availableClasses[Math.floor(Math.random() * availableClasses.length)];
      const confidence = Math.random() * 0.3 + 0.7; // 70-100%
      
      setTestResult(`${randomClass.emoji} ${randomClass.name} (${Math.round(confidence * 100)}%)`);
      setIsTesting(false);
      
      toast({
        title: "Prediksi selesai",
        description: `Hasil: ${randomClass.name} dengan confidence ${Math.round(confidence * 100)}%`
      });
    }, 3000);
  };

  const totalSamples = classes.reduce((sum, c) => sum + c.samples.length, 0);

  return (
    <div className="min-h-screen bg-light-gray py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
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
              <p className="text-gray-600">Ajarkan AI untuk mengenali pose tubuh dan gerakan</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className="bg-success-green text-white">
              {totalSamples} Sampel
            </Badge>
            <Badge className="bg-google-blue text-white">
              {classes.length} Kelas
            </Badge>
          </div>
        </div>

        {/* Webcam Section */}
        <Card className="mb-8 bg-white rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-fredoka text-dark-text">Kamera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                {webcamActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    onLoadedData={() => {
                      if (videoRef.current) {
                        videoRef.current.play();
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <Camera className="text-6xl mb-4 mx-auto opacity-50" />
                      <p className="text-lg">Kamera belum aktif</p>
                    </div>
                  </div>
                )}
                
                {isCapturing && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    Menangkap Pose ({captureCount}/5)
                  </div>
                )}
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={webcamActive ? stopWebcam : startWebcam}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-12 ${
                    webcamActive 
                      ? 'bg-alert-red text-white hover:bg-red-600' 
                      : 'bg-success-green text-white hover:bg-green-600'
                  }`}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {webcamActive ? 'Matikan Kamera' : 'Nyalakan Kamera'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add New Class Button */}
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

        {/* Add New Class Form */}
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
                    placeholder="Contoh: Tangan Kedua Naik, Pose T"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addClass()}
                  />
                </div>
                <div>
                  <Label htmlFor="classEmoji">Emoji</Label>
                  <Input
                    id="classEmoji"
                    className="w-20 text-center"
                    value={newClassEmoji}
                    onChange={(e) => setNewClassEmoji(e.target.value)}
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
                <Button 
                  variant="outline"
                  onClick={() => setShowAddClass(false)}
                  className="px-6 py-3 rounded-xl font-semibold h-12"
                >
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Classes Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {classes.map((poseClass) => (
            <Card key={poseClass.id} className={`bg-gradient-to-br ${poseClass.color} text-white rounded-3xl shadow-xl`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{poseClass.emoji}</div>
                    <div>
                      <CardTitle className="text-2xl font-fredoka">{poseClass.name}</CardTitle>
                      <Badge className="bg-white text-gray-800 font-bold w-fit">
                        {poseClass.samples.length} pose
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeClass(poseClass.id)}
                    className="text-white hover:bg-white/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Capture Area */}
                  <div className="border-4 border-dashed border-white rounded-2xl p-8 text-center">
                    {isCapturing && capturingClassId === poseClass.id ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          <span className="text-lg font-bold">Menangkap Pose</span>
                        </div>
                        <div className="text-2xl font-bold">{captureCount}/5</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <UserCheck className="text-4xl mx-auto" />
                        <div>
                          <p className="text-lg font-bold mb-2">Lakukan pose {poseClass.name.toLowerCase()}</p>
                          <p className="opacity-75">Klik untuk mulai menangkap gerakan</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
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
                      <>
                        <Button
                          onClick={() => startCapturing(poseClass.id)}
                          disabled={isCapturing || !webcamActive}
                          className="flex-1 bg-white text-gray-800 hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-12"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Rekam Gerakan
                        </Button>
                        <Button
                          className="flex-1 bg-white text-gray-800 hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-12"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Lihat Contoh
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Samples List */}
                  {poseClass.samples.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-white">Pose Tersimpan:</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {poseClass.samples.slice(0, 6).map((sample, index) => (
                          <div key={sample.id} className="relative group">
                            <img 
                              src={sample.imageData} 
                              alt={`Pose ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
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
                      {poseClass.samples.length > 6 && (
                        <p className="text-sm text-white/80">
                          +{poseClass.samples.length - 6} pose lainnya
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Training Section */}
        {totalSamples > 0 && (
          <Card className="mb-8 bg-white rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-fredoka text-dark-text">Latih Model AI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isTraining ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Brain className="h-6 w-6 text-google-blue animate-pulse" />
                      <span className="text-lg font-medium">Melatih model AI...</span>
                    </div>
                    <Progress value={trainingProgress} className="h-3" />
                    <p className="text-sm text-gray-600 text-center">
                      {trainingProgress}% selesai
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <Button
                      onClick={trainModel}
                      disabled={classes.length < 2 || totalSamples < 6}
                      className="bg-success-green text-white hover:bg-green-600 px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-14"
                    >
                      <Brain className="mr-2 h-5 w-5" />
                      Latih Model AI
                    </Button>
                    {modelTrained && (
                      <Badge className="bg-success-green text-white">
                        Model Sudah Dilatih
                      </Badge>
                    )}
                    <p className="text-sm text-gray-600">
                      {classes.length < 2 && "Minimal 2 kelas diperlukan"}
                      {classes.length >= 2 && totalSamples < 6 && "Minimal 3 pose per kelas diperlukan"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Testing Section */}
        {modelTrained && (
          <Card className="bg-white rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-fredoka text-dark-text">Uji Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <p className="text-gray-600">
                  Klik tombol di bawah untuk menguji model dengan pose baru (durasi 3 detik)
                </p>
                
                <Button
                  onClick={testModel}
                  disabled={isTesting || !webcamActive}
                  className="bg-orange text-white hover:bg-orange/80 px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-14"
                >
                  <TestTube className="mr-2 h-5 w-5" />
                  {isTesting ? "Menguji..." : "Uji Model"}
                </Button>

                {!webcamActive && (
                  <p className="text-sm text-gray-500">
                    Nyalakan kamera terlebih dahulu untuk menguji model
                  </p>
                )}

                {testResult && (
                  <div className="bg-success-green bg-opacity-10 rounded-2xl p-6">
                    <h3 className="text-lg font-fredoka text-dark-text mb-2">Hasil Prediksi:</h3>
                    <div className="text-2xl font-bold text-success-green">
                      {testResult}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {totalSamples === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🤸‍♂️</div>
            <h2 className="text-2xl font-fredoka text-dark-text mb-4">
              Mulai Proyek Klasifikasi Gerakan
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Nyalakan kamera dan lakukan berbagai pose untuk setiap kelas. 
              AI akan belajar mengenali perbedaan gerakan tubuh Anda! 
              Minimal 3 pose per kelas diperlukan untuk pelatihan.
            </p>
          </div>
        )}

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />

      </div>
    </div>
  );
}