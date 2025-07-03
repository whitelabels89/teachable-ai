import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Mic, MicOff, Play, Pause, Square, ArrowLeft, Plus, Trash2, Brain, TestTube, Volume2, Upload } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface AudioSample {
  id: string;
  data: string; // base64 encoded audio
  duration: number;
  timestamp: number;
}

interface SoundClass {
  id: string;
  name: string;
  emoji: string;
  samples: AudioSample[];
  color: string;
}

export default function SoundClassifier() {
  const [classes, setClasses] = useState<SoundClass[]>([
    {
      id: "1",
      name: "Tepuk Tangan",
      emoji: "👏",
      samples: [],
      color: "from-success-green to-green-400"
    },
    {
      id: "2", 
      name: "Siulan",
      emoji: "🎵",
      samples: [],
      color: "from-orange to-yellow-400"
    }
  ]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingClassId, setRecordingClassId] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [modelTrained, setModelTrained] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newClassEmoji, setNewClassEmoji] = useState("🔊");
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAddClass, setShowAddClass] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const colorOptions = [
    "from-success-green to-green-400",
    "from-orange to-yellow-400", 
    "from-purple to-pink-400",
    "from-google-blue to-blue-400",
    "from-alert-red to-red-400"
  ];

  // Initialize audio context
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

  const addClass = () => {
    if (!newClassName.trim()) return;
    
    const newClass: SoundClass = {
      id: Date.now().toString(),
      name: newClassName.trim(),
      emoji: newClassEmoji,
      samples: [],
      color: colorOptions[classes.length % colorOptions.length]
    };
    
    setClasses(prev => [...prev, newClass]);
    setNewClassName("");
    setNewClassEmoji("🔊");
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
      description: "Kelas dan semua sampel suara telah dihapus"
    });
  };

  const startRecording = async (classId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          addAudioSample(classId, base64, recordingTime);
        };
        reader.readAsDataURL(audioBlob);
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingClassId(classId);
      setRecordingTime(0);
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Mulai merekam",
        description: "Buat suara yang jelas dan konsisten"
      });
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Tidak dapat mengakses mikrofon. Pastikan izin mikrofon telah diberikan.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingClassId(null);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      toast({
        title: "Rekaman selesai",
        description: `Durasi: ${recordingTime} detik`
      });
    }
  };

  const addAudioSample = (classId: string, audioData: string, duration: number) => {
    const sample: AudioSample = {
      id: Date.now().toString(),
      data: audioData,
      duration,
      timestamp: Date.now()
    };
    
    setClasses(prev => prev.map(c => 
      c.id === classId 
        ? { ...c, samples: [...c.samples, sample] }
        : c
    ));
    
    toast({
      title: "Sampel suara berhasil ditambahkan!",
      description: `Durasi: ${duration} detik`
    });
  };

  const removeSample = (classId: string, sampleId: string) => {
    setClasses(prev => prev.map(c => 
      c.id === classId 
        ? { ...c, samples: c.samples.filter(s => s.id !== sampleId) }
        : c
    ));
  };

  const playAudio = (audioData: string) => {
    const audio = new Audio(audioData);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      toast({
        title: "Error",
        description: "Tidak dapat memutar audio",
        variant: "destructive"
      });
    });
  };

  const handleFileUpload = (classId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Format file tidak didukung",
        description: "Harap pilih file audio (MP3, WAV, dll)",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Get audio duration (approximate)
      const audio = new Audio(base64);
      audio.onloadedmetadata = () => {
        addAudioSample(classId, base64, Math.round(audio.duration));
      };
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
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

    const hasEnoughSamples = classes.every(c => c.samples.length >= 2);
    if (!hasEnoughSamples) {
      toast({
        title: "Tidak cukup sampel",
        description: "Setiap kelas minimal membutuhkan 2 sampel suara",
        variant: "destructive"
      });
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    setModelTrained(false);

    // Simulate training process with more realistic progression
    const steps = [
      { progress: 10, message: "Memproses audio..." },
      { progress: 30, message: "Ekstraksi fitur..." },
      { progress: 50, message: "Inisialisasi model..." },
      { progress: 70, message: "Pelatihan dimulai..." },
      { progress: 85, message: "Validasi model..." },
      { progress: 100, message: "Pelatihan selesai!" }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setTrainingProgress(step.progress);
    }

    setIsTraining(false);
    setModelTrained(true);
    toast({
      title: "Model berhasil dilatih!",
      description: "Sekarang Anda dapat menguji model dengan suara baru"
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

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Simulate prediction with more realistic results
        const availableClasses = classes.filter(c => c.samples.length > 0);
        const randomClass = availableClasses[Math.floor(Math.random() * availableClasses.length)];
        const confidence = Math.random() * 0.3 + 0.7; // 70-100%
        
        setTestResult(`${randomClass.emoji} ${randomClass.name} (${Math.round(confidence * 100)}%)`);
        setIsTesting(false);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        toast({
          title: "Prediksi selesai",
          description: `Hasil: ${randomClass.name} dengan confidence ${Math.round(confidence * 100)}%`
        });
      };
      
      setIsTesting(true);
      setTestResult(null);
      mediaRecorder.start();
      
      toast({
        title: "Menguji model...",
        description: "Buat suara selama 3 detik"
      });
      
      // Auto stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error testing model:', error);
      toast({
        title: "Error",
        description: "Tidak dapat mengakses mikrofon untuk pengujian",
        variant: "destructive"
      });
      setIsTesting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
              <h1 className="text-3xl font-fredoka text-dark-text">Klasifikasi Suara</h1>
              <p className="text-gray-600">Ajarkan AI untuk mengenali berbagai suara</p>
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
                    placeholder="Contoh: Suara Kucing, Ketukan Pintu"
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
          {classes.map((soundClass) => (
            <Card key={soundClass.id} className={`bg-gradient-to-br ${soundClass.color} text-white rounded-3xl shadow-xl`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{soundClass.emoji}</div>
                    <div>
                      <CardTitle className="text-2xl font-fredoka">{soundClass.name}</CardTitle>
                      <Badge className="bg-white text-gray-800 font-bold w-fit">
                        {soundClass.samples.length} rekaman
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeClass(soundClass.id)}
                    className="text-white hover:bg-white/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Recording Area */}
                  <div className="border-4 border-dashed border-white rounded-2xl p-8 text-center">
                    {isRecording && recordingClassId === soundClass.id ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-lg font-bold">Sedang Merekam</span>
                        </div>
                        <div className="text-2xl font-bold">{formatTime(recordingTime)}</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Mic className="text-4xl mx-auto" />
                        <div>
                          <p className="text-lg font-bold mb-2">Rekam suara {soundClass.name.toLowerCase()}</p>
                          <p className="opacity-75">Klik untuk mulai merekam</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    {isRecording && recordingClassId === soundClass.id ? (
                      <Button
                        onClick={stopRecording}
                        className="flex-1 bg-alert-red text-white hover:bg-red-600 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-12"
                      >
                        <Square className="mr-2 h-4 w-4" />
                        Berhenti
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => startRecording(soundClass.id)}
                          disabled={isRecording}
                          className="flex-1 bg-white text-gray-800 hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-12"
                        >
                          <Mic className="mr-2 h-4 w-4" />
                          Rekam Suara
                        </Button>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 bg-white text-gray-800 hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-12"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload File
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={(e) => handleFileUpload(soundClass.id, e)}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>

                  {/* Samples List */}
                  {soundClass.samples.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-white">Rekaman:</h4>
                      {soundClass.samples.map((sample, index) => (
                        <div key={sample.id} className="flex items-center justify-between bg-white/20 rounded-xl p-3">
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => playAudio(sample.data)}
                              className="text-white hover:bg-white/20"
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                            <span className="text-sm">
                              Rekaman {index + 1} ({formatTime(sample.duration)})
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSample(soundClass.id, sample.id)}
                            className="text-white hover:bg-white/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
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
                      disabled={classes.length < 2 || totalSamples < 4}
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
                      {classes.length >= 2 && totalSamples < 4 && "Minimal 2 rekaman per kelas diperlukan"}
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
                  Klik tombol di bawah untuk menguji model dengan suara baru (durasi 3 detik)
                </p>
                
                <Button
                  onClick={testModel}
                  disabled={isTesting}
                  className="bg-orange text-white hover:bg-orange/80 px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-14"
                >
                  <TestTube className="mr-2 h-5 w-5" />
                  {isTesting ? "Menguji..." : "Uji Model"}
                </Button>

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
            <div className="text-6xl mb-6">🎵</div>
            <h2 className="text-2xl font-fredoka text-dark-text mb-4">
              Mulai Proyek Klasifikasi Suara
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Rekam beberapa sampel suara untuk setiap kelas. 
              AI akan belajar membedakan suara-suara tersebut! 
              Minimal 2 rekaman per kelas diperlukan untuk pelatihan.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}