import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Mic, Square, ArrowLeft, Plus, Trash2, Brain, TestTube, Volume2, Upload } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface AudioSample {
  id: string;
  data: string;
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

interface TrainedSoundClass {
  classId: string;
  className: string;
  emoji: string;
  centroid: number[];
  sampleCount: number;
}

interface SoundPrediction {
  classId: string;
  className: string;
  emoji: string;
  confidence: number;
  similarity: number;
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

export default function SoundClassifier() {
  const [classes, setClasses] = useState<SoundClass[]>([
    {
      id: "1",
      name: "Tepuk Tangan",
      emoji: "👏",
      samples: [],
      color: "from-success-green to-green-400",
    },
    {
      id: "2",
      name: "Siulan",
      emoji: "🎵",
      samples: [],
      color: "from-orange to-yellow-400",
    },
  ]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingClassId, setRecordingClassId] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingMessage, setTrainingMessage] = useState("Belum training");
  const [modelTrained, setModelTrained] = useState(false);
  const [trainedClasses, setTrainedClasses] = useState<TrainedSoundClass[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [predictions, setPredictions] = useState<SoundPrediction[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [newClassEmoji, setNewClassEmoji] = useState("🔊");
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAddClass, setShowAddClass] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimeRef = useRef(0);
  const uploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { toast } = useToast();

  const colorOptions = [
    "from-success-green to-green-400",
    "from-orange to-yellow-400",
    "from-purple to-pink-400",
    "from-google-blue to-blue-400",
    "from-alert-red to-red-400",
  ];

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const markModelAsDirty = () => {
    setModelTrained(false);
    setTrainedClasses([]);
    setPredictions([]);
  };

  const readBlobAsDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Gagal membaca file audio."));
      reader.readAsDataURL(blob);
    });

  const getAudioDuration = (dataUrl: string) =>
    new Promise<number>((resolve) => {
      const audio = new Audio(dataUrl);
      audio.onloadedmetadata = () => {
        const duration = Number.isFinite(audio.duration) ? Math.max(1, Math.round(audio.duration)) : 1;
        resolve(duration);
      };
      audio.onerror = () => resolve(1);
    });

  const extractAudioFeatures = async (dataUrl: string): Promise<number[]> => {
    const response = await fetch(dataUrl);
    const audioArrayBuffer = await response.arrayBuffer();

    const audioContext = new AudioContext();

    try {
      const decodedBuffer = await audioContext.decodeAudioData(audioArrayBuffer.slice(0));
      const channelData = decodedBuffer.getChannelData(0);

      if (channelData.length < 32) {
        throw new Error("Sampel audio terlalu pendek.");
      }

      const features: number[] = [];

      let rms = 0;
      let absMean = 0;
      let zeroCrossing = 0;
      let peak = 0;

      for (let i = 0; i < channelData.length; i += 1) {
        const sample = channelData[i];
        rms += sample * sample;
        absMean += Math.abs(sample);
        peak = Math.max(peak, Math.abs(sample));

        if (i > 0 && Math.sign(sample) !== Math.sign(channelData[i - 1])) {
          zeroCrossing += 1;
        }
      }

      rms = Math.sqrt(rms / channelData.length);
      absMean /= channelData.length;
      const zcr = zeroCrossing / channelData.length;

      features.push(rms, absMean, zcr, peak);

      const bands = 16;
      const bandSize = Math.floor(channelData.length / bands);
      for (let band = 0; band < bands; band += 1) {
        const start = band * bandSize;
        const end = band === bands - 1 ? channelData.length : start + bandSize;

        let energy = 0;
        for (let i = start; i < end; i += 1) {
          const sample = channelData[i];
          energy += sample * sample;
        }

        const normalizedEnergy = Math.sqrt(energy / Math.max(1, end - start));
        features.push(normalizedEnergy);
      }

      const maxValue = Math.max(...features.map((value) => Math.abs(value)), 1e-6);
      return features.map((value) => value / maxValue);
    } finally {
      await audioContext.close();
    }
  };

  const addClass = () => {
    if (!newClassName.trim()) {
      return;
    }

    const newClass: SoundClass = {
      id: createId(),
      name: newClassName.trim(),
      emoji: newClassEmoji || "🔊",
      samples: [],
      color: colorOptions[classes.length % colorOptions.length],
    };

    setClasses((prev) => [...prev, newClass]);
    setNewClassName("");
    setNewClassEmoji("🔊");
    setShowAddClass(false);
    markModelAsDirty();

    toast({
      title: "Kelas ditambahkan",
      description: `Kelas "${newClass.name}" siap diisi sampel suara.`,
    });
  };

  const removeClass = (classId: string) => {
    setClasses((prev) => prev.filter((item) => item.id !== classId));
    markModelAsDirty();

    toast({
      title: "Kelas dihapus",
      description: "Kelas dan semua sampel suaranya telah dihapus.",
    });
  };

  const addAudioSample = (classId: string, audioData: string, duration: number) => {
    const sample: AudioSample = {
      id: createId(),
      data: audioData,
      duration,
      timestamp: Date.now(),
    };

    setClasses((prev) =>
      prev.map((item) => (item.id === classId ? { ...item, samples: [...item.samples, sample] } : item)),
    );
    markModelAsDirty();

    toast({
      title: "Sampel ditambahkan",
      description: `Durasi ${duration} detik berhasil disimpan.`,
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

  const startRecording = async (classId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      stopStream();
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalDuration = Math.max(1, recordingTimeRef.current);
        const audioBlob = new Blob(chunks, { type: mimeType });

        readBlobAsDataUrl(audioBlob)
          .then((base64) => {
            addAudioSample(classId, base64, finalDuration);
          })
          .catch((error) => {
            toast({
              title: "Gagal menyimpan rekaman",
              description: error instanceof Error ? error.message : "Terjadi kesalahan.",
              variant: "destructive",
            });
          });
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingClassId(classId);
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      intervalRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
      }, 1000);

      toast({
        title: "Rekaman dimulai",
        description: "Buat suara dengan jelas dan konsisten.",
      });
    } catch (error) {
      toast({
        title: "Tidak bisa mengakses mikrofon",
        description: error instanceof Error ? error.message : "Pastikan izin mikrofon sudah diberikan.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) {
      return;
    }

    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setRecordingClassId(null);
    recordingTimeRef.current = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    stopStream();
  };

  const playAudio = (audioData: string) => {
    const audio = new Audio(audioData);
    audio.play().catch(() => {
      toast({
        title: "Audio gagal diputar",
        description: "Browser menolak pemutaran audio otomatis.",
        variant: "destructive",
      });
    });
  };

  const handleFileUpload = async (classId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Format tidak didukung",
        description: "Pilih file audio seperti MP3, WAV, atau OGG.",
        variant: "destructive",
      });
      return;
    }

    try {
      const dataUrl = await readBlobAsDataUrl(file);
      const duration = await getAudioDuration(dataUrl);
      addAudioSample(classId, dataUrl, duration);
    } catch (error) {
      toast({
        title: "Upload gagal",
        description: error instanceof Error ? error.message : "Gagal memproses file audio.",
        variant: "destructive",
      });
    }
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

    if (classes.some((item) => item.samples.length < 2)) {
      toast({
        title: "Sampel belum cukup",
        description: "Setiap kelas minimal harus punya 2 rekaman.",
        variant: "destructive",
      });
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingMessage("Ekstraksi fitur audio...");
    setPredictions([]);

    try {
      const totalSamples = classes.reduce((sum, item) => sum + item.samples.length, 0);
      let processedSamples = 0;

      const featuresByClass: Record<string, number[][]> = {};

      for (const soundClass of classes) {
        featuresByClass[soundClass.id] = [];

        for (const sample of soundClass.samples) {
          const features = await extractAudioFeatures(sample.data);
          featuresByClass[soundClass.id].push(features);
          processedSamples += 1;

          setTrainingProgress(Math.round((processedSamples / totalSamples) * 75));
          setTrainingMessage(`Memproses ${processedSamples}/${totalSamples} sampel audio...`);
        }
      }

      setTrainingMessage("Membangun representasi kelas...");
      setTrainingProgress(85);

      const trained = classes.map((soundClass) => ({
        classId: soundClass.id,
        className: soundClass.name,
        emoji: soundClass.emoji,
        centroid: computeCentroid(featuresByClass[soundClass.id]),
        sampleCount: featuresByClass[soundClass.id].length,
      }));

      setTrainingProgress(100);
      setTrainingMessage("Training selesai");
      setTrainedClasses(trained);
      setModelTrained(true);

      toast({
        title: "Model suara siap",
        description: "Sekarang model bisa diuji dengan suara baru.",
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

  const classifyAudio = async (audioData: string) => {
    if (!modelTrained || trainedClasses.length === 0) {
      throw new Error("Model belum dilatih.");
    }

    const inputFeatures = await extractAudioFeatures(audioData);

    const rawScores = trainedClasses.map((trainedClass) => ({
      ...trainedClass,
      similarity: cosineSimilarity(inputFeatures, trainedClass.centroid),
    }));

    const expScores = rawScores.map((item) => Math.exp(item.similarity * 4));
    const scoreSum = expScores.reduce((sum, value) => sum + value, 0) || 1;

    return rawScores
      .map((item, index) => ({
        classId: item.classId,
        className: item.className,
        emoji: item.emoji,
        similarity: item.similarity,
        confidence: expScores[index] / scoreSum,
      }))
      .sort((a, b) => b.confidence - a.confidence);
  };

  const testModel = async () => {
    if (!modelTrained || trainedClasses.length === 0) {
      toast({
        title: "Model belum siap",
        description: "Lakukan training sebelum pengujian.",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      stopStream();
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });

        readBlobAsDataUrl(blob)
          .then((dataUrl) => classifyAudio(dataUrl))
          .then((result) => {
            setPredictions(result);
            const topResult = result[0];
            toast({
              title: "Prediksi selesai",
              description: `${topResult.emoji} ${topResult.className} (${Math.round(topResult.confidence * 100)}%)`,
            });
          })
          .catch((error) => {
            toast({
              title: "Prediksi gagal",
              description: error instanceof Error ? error.message : "Gagal menguji model.",
              variant: "destructive",
            });
          })
          .finally(() => {
            setIsTesting(false);
            stopStream();
          });
      };

      setIsTesting(true);
      setPredictions([]);
      mediaRecorder.start();

      toast({
        title: "Pengujian dimulai",
        description: "Buat suara selama 3 detik.",
      });

      window.setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 3000);
    } catch (error) {
      setIsTesting(false);
      toast({
        title: "Tidak bisa mengakses mikrofon",
        description: error instanceof Error ? error.message : "Gagal memulai pengujian.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
              <h1 className="text-3xl font-fredoka text-dark-text">Klasifikasi Suara</h1>
              <p className="text-gray-600">Ajarkan AI mengenali pola suara secara praktis</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className="bg-success-green text-white">{totalSamples} Sampel</Badge>
            <Badge className="bg-google-blue text-white">{classes.length} Kelas</Badge>
          </div>
        </div>

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
                    placeholder="Contoh: Bel Sekolah, Pintu Ditutup"
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
          {classes.map((soundClass) => (
            <Card key={soundClass.id} className={`bg-gradient-to-br ${soundClass.color} text-white rounded-3xl shadow-xl`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{soundClass.emoji}</div>
                    <div>
                      <CardTitle className="text-2xl font-fredoka">{soundClass.name}</CardTitle>
                      <Badge className="bg-white text-gray-800 font-bold w-fit">{soundClass.samples.length} rekaman</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeClass(soundClass.id)} className="text-white hover:bg-white/20">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-4 border-dashed border-white rounded-2xl p-8 text-center">
                    {isRecording && recordingClassId === soundClass.id ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-lg font-bold">Sedang Merekam</span>
                        </div>
                        <div className="text-2xl font-bold">{formatTime(recordingTime)}</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Mic className="h-10 w-10 mx-auto" />
                        <div>
                          <p className="text-lg font-bold mb-2">Rekam suara {soundClass.name.toLowerCase()}</p>
                          <p className="opacity-75">Buat sampel yang jelas dan konsisten</p>
                        </div>
                      </div>
                    )}
                  </div>

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
                          disabled={isRecording || isTraining || isTesting}
                          className="flex-1 bg-white text-gray-800 hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-12"
                        >
                          <Mic className="mr-2 h-4 w-4" />
                          Rekam
                        </Button>
                        <Button
                          onClick={() => uploadInputRefs.current[soundClass.id]?.click()}
                          disabled={isRecording || isTraining || isTesting}
                          className="flex-1 bg-white text-gray-800 hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-12"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                        <input
                          ref={(node) => {
                            uploadInputRefs.current[soundClass.id] = node;
                          }}
                          type="file"
                          accept="audio/*"
                          onChange={(event) => {
                            handleFileUpload(soundClass.id, event).catch(() => {
                              toast({
                                title: "Upload gagal",
                                description: "Terjadi kesalahan saat memproses file.",
                                variant: "destructive",
                              });
                            });
                          }}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>

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

        {totalSamples > 0 && (
          <Card className="mb-8 bg-white rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-fredoka text-dark-text">Latih Model Suara</CardTitle>
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
                      disabled={classes.length < 2 || classes.some((item) => item.samples.length < 2)}
                      className="bg-success-green text-white hover:bg-green-600 px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-14"
                    >
                      <Brain className="mr-2 h-5 w-5" />
                      Latih Model AI
                    </Button>
                    {modelTrained && <Badge className="bg-success-green text-white">Model Sudah Dilatih</Badge>}
                    <p className="text-sm text-gray-600">
                      {classes.length < 2 && "Minimal 2 kelas diperlukan"}
                      {classes.length >= 2 && classes.some((item) => item.samples.length < 2) && "Setiap kelas butuh minimal 2 rekaman"}
                      {classes.length >= 2 && !classes.some((item) => item.samples.length < 2) && "Model akan belajar dari pola energi dan ritme suara"}
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
                <p className="text-gray-600">Tekan tombol untuk merekam suara baru selama 3 detik.</p>

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
                  disabled={isTesting || isTraining}
                  className="bg-orange text-white hover:bg-orange/80 px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg transform hover:scale-105 h-14"
                >
                  <TestTube className="mr-2 h-5 w-5" />
                  {isTesting ? "Merekam dan menganalisis..." : "Uji Model"}
                </Button>

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
            <div className="text-6xl mb-6">🎵</div>
            <h2 className="text-2xl font-fredoka text-dark-text mb-4">Mulai Proyek Klasifikasi Suara</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Rekam minimal 2 contoh suara di setiap kelas. Setelah itu model bisa belajar dan dipakai untuk pengujian real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
