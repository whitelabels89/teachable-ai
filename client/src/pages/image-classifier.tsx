import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTensorFlow, type ClassData } from "@/hooks/use-tensorflow";
import WebcamCapture from "@/components/webcam-capture";
import TrainingInterface from "@/components/training-interface";
import TestingInterface from "@/components/testing-interface";
import { Plus, Upload, Camera, Play, Brain, TestTube, Save, FolderOpen, Trash2 } from "lucide-react";

const STEPS = [
  { id: 1, title: "Kumpulkan", icon: Upload },
  { id: 2, title: "Latih", icon: Brain },
  { id: 3, title: "Uji", icon: TestTube },
] as const;

const CARD_GRADIENTS = [
  "bg-gradient-to-br from-success-green to-green-400",
  "bg-gradient-to-br from-orange to-yellow-400",
  "bg-gradient-to-br from-google-blue to-blue-500",
  "bg-gradient-to-br from-purple to-pink-500",
  "bg-gradient-to-br from-alert-red to-red-400",
];

const createSampleId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type ImageClass = ClassData;

export default function ImageClassifier() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [classes, setClasses] = useState<ImageClass[]>([
    { id: "class1", name: "Kucing 🐱", samples: [] },
    { id: "class2", name: "Anjing 🐶", samples: [] },
  ]);
  const [showWebcam, setShowWebcam] = useState(false);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [modelName, setModelName] = useState("");
  const [loadingModelId, setLoadingModelId] = useState<string | null>(null);

  const { toast } = useToast();
  const {
    isLoading,
    trainModel,
    predictImage,
    saveModel,
    loadModel,
    deleteSavedModel,
    downloadModel,
    resetModel,
    isModelTrained,
    trainingProgress,
    classLabels,
    savedModels,
    activeModelId,
  } = useTensorFlow();

  const trainableClasses = useMemo(() => classes.filter((cls) => cls.samples.length > 0), [classes]);
  const testableClasses = useMemo(
    () =>
      trainableClasses.length > 0
        ? trainableClasses
        : classLabels.map((label, index) => ({
            id: `saved-class-${index}`,
            name: label,
            samples: [],
          })),
    [trainableClasses, classLabels],
  );

  const invalidateTrainedModel = () => {
    if (isModelTrained) {
      resetModel();
      setCurrentStep(1);
      toast({
        title: "Model direset",
        description: "Data berubah. Latih ulang model agar hasil uji tetap akurat.",
      });
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Gagal membaca file ${file.name}`));
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (files: FileList, classId: string) => {
    const selectedFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));

    if (selectedFiles.length === 0) {
      toast({
        title: "File tidak valid",
        description: "Pilih file gambar (JPG/PNG/WebP).",
        variant: "destructive",
      });
      return;
    }

    try {
      const dataUrls = await Promise.all(selectedFiles.map((file) => fileToDataUrl(file)));
      const newSamples = dataUrls.map((data) => ({
        id: createSampleId(),
        type: "file",
        data,
        timestamp: Date.now(),
      }));

      setClasses((prev) =>
        prev.map((cls) => (cls.id === classId ? { ...cls, samples: [...cls.samples, ...newSamples] } : cls)),
      );

      invalidateTrainedModel();

      const className = classes.find((cls) => cls.id === classId)?.name ?? "kelas";
      toast({
        title: "Gambar ditambahkan",
        description: `${newSamples.length} gambar masuk ke kelas ${className}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengunggah gambar.";
      toast({
        title: "Upload gagal",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleWebcamCapture = (imageData: string) => {
    if (!activeClassId) {
      return;
    }

    const newSample = {
      id: createSampleId(),
      type: "webcam",
      data: imageData,
      timestamp: Date.now(),
    };

    setClasses((prev) =>
      prev.map((cls) => (cls.id === activeClassId ? { ...cls, samples: [...cls.samples, newSample] } : cls)),
    );

    invalidateTrainedModel();

    const className = classes.find((cls) => cls.id === activeClassId)?.name ?? "kelas";
    toast({
      title: "Foto berhasil diambil",
      description: `Foto ditambahkan ke kelas ${className}.`,
    });
  };

  const handleTrainModel = async () => {
    if (trainableClasses.length < 2) {
      toast({
        title: "Data belum cukup",
        description: "Minimal 2 kelas yang memiliki sampel agar model bisa dilatih.",
        variant: "destructive",
      });
      return;
    }

    if (trainableClasses.some((cls) => cls.samples.length < 2)) {
      toast({
        title: "Sampel kurang",
        description: "Setiap kelas butuh minimal 2 gambar agar hasil latihan stabil.",
        variant: "destructive",
      });
      return;
    }

    const preparedClasses = trainableClasses.map((cls, index) => ({
      ...cls,
      name: cls.name.trim() || `Kelas ${index + 1}`,
    }));

    setClasses((prev) =>
      prev.map((cls) => {
        const found = preparedClasses.find((prepared) => prepared.id === cls.id);
        return found ? { ...cls, name: found.name } : cls;
      }),
    );

    setTrainingError(null);
    setCurrentStep(2);

    try {
      await trainModel(preparedClasses);
      toast({
        title: "Training selesai",
        description: "Model AI siap diuji dengan gambar baru.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Training gagal.";
      setTrainingError(message);
      toast({
        title: "Training gagal",
        description: message,
        variant: "destructive",
      });
    }
  };

  const addClass = () => {
    const nextNumber = classes.length + 1;
    const newClass: ImageClass = {
      id: `class-${Date.now()}`,
      name: `Kelas ${nextNumber}`,
      samples: [],
    };

    setClasses((prev) => [...prev, newClass]);
    invalidateTrainedModel();
  };

  const updateClassName = (classId: string, newName: string) => {
    setClasses((prev) => prev.map((cls) => (cls.id === classId ? { ...cls, name: newName } : cls)));
  };

  const getStepColor = (step: number) => {
    if (step < currentStep) return "bg-success-green";
    if (step === currentStep) return "bg-google-blue";
    return "bg-gray-300";
  };

  const canTrain = trainableClasses.length >= 2;
  const totalTrainSamples = trainableClasses.reduce((sum, cls) => sum + cls.samples.length, 0);

  const formatDateTime = (timestamp: number) =>
    new Date(timestamp).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const handleSaveModel = async () => {
    if (!isModelTrained) {
      toast({
        title: "Model belum siap",
        description: "Latih model terlebih dahulu sebelum menyimpan.",
        variant: "destructive",
      });
      return;
    }

    const fallbackName = `Model ${new Date().toLocaleDateString("id-ID")}`;
    const finalName = modelName.trim() || fallbackName;

    try {
      const record = await saveModel(finalName, { sampleCount: totalTrainSamples });
      setModelName(record.name);
      toast({
        title: "Model disimpan",
        description: `"${record.name}" tersimpan dan bisa dibuka kembali kapan saja.`,
      });
    } catch (error) {
      toast({
        title: "Simpan model gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan model.",
        variant: "destructive",
      });
    }
  };

  const handleLoadSavedModel = async (savedModelId: string) => {
    try {
      setLoadingModelId(savedModelId);
      const loadedRecord = await loadModel(savedModelId);
      if (loadedRecord) {
        setModelName(loadedRecord.name);
      }
      setCurrentStep(3);
      toast({
        title: "Model dibuka",
        description: "Model tersimpan siap dipakai untuk pengujian.",
      });
    } catch (error) {
      toast({
        title: "Gagal membuka model",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat memuat model.",
        variant: "destructive",
      });
    } finally {
      setLoadingModelId(null);
    }
  };

  const handleDeleteSavedModel = async (savedModelId: string, savedModelName: string) => {
    const confirmed = window.confirm(`Hapus model \"${savedModelName}\" dari penyimpanan?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteSavedModel(savedModelId);
      toast({
        title: "Model dihapus",
        description: `Model \"${savedModelName}\" sudah dihapus dari penyimpanan.`,
      });
    } catch (error) {
      toast({
        title: "Gagal menghapus model",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus model.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-light-gray py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-fredoka text-dark-text mb-4">Klasifikasi Gambar</h1>
          <p className="text-gray-600 text-lg">Kumpulkan data, latih model, lalu uji hasilnya bersama murid.</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`w-12 h-12 ${getStepColor(step.id)} rounded-full flex items-center justify-center text-white font-bold`}>
                    {step.id <= currentStep ? <Icon className="h-6 w-6" /> : step.id}
                  </div>
                  <span className={`ml-2 font-bold ${step.id <= currentStep ? "text-google-blue" : "text-gray-400"}`}>{step.title}</span>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 h-1 mx-4 rounded ${step.id < currentStep ? "bg-success-green" : "bg-gray-300"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Card className="mb-8 bg-white rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-fredoka text-dark-text">Model AI Tersimpan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-[1fr_auto] gap-4 items-end mb-6">
              <div>
                <label className="text-sm font-semibold text-gray-600">Nama Model</label>
                <Input
                  value={modelName}
                  onChange={(event) => setModelName(event.target.value)}
                  placeholder="Contoh: Model Hewan Kelas 4A"
                />
              </div>
              <Button
                onClick={handleSaveModel}
                disabled={!isModelTrained || isLoading}
                className="bg-success-green text-white hover:bg-green-600 h-11 px-6"
              >
                <Save className="mr-2 h-4 w-4" />
                Simpan Model AI
              </Button>
            </div>

            {savedModels.length > 0 ? (
              <div className="space-y-3">
                {savedModels.map((savedModel) => (
                  <div
                    key={savedModel.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-dark-text">{savedModel.name}</p>
                        {activeModelId === savedModel.id && <Badge className="bg-google-blue text-white">Aktif</Badge>}
                      </div>
                      <p className="text-sm text-gray-600">
                        {savedModel.labels.length} kelas · {savedModel.sampleCount} sampel · diperbarui{" "}
                        {formatDateTime(savedModel.updatedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          handleLoadSavedModel(savedModel.id).catch(() => {
                            // handled in function
                          });
                        }}
                        disabled={isLoading && loadingModelId === savedModel.id}
                        className="bg-google-blue text-white hover:bg-blue-600"
                      >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        {isLoading && loadingModelId === savedModel.id ? "Membuka..." : "Buka Uji"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleDeleteSavedModel(savedModel.id, savedModel.name).catch(() => {
                            // handled in function
                          });
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Belum ada model tersimpan. Setelah training selesai, isi nama model lalu klik simpan.
              </p>
            )}
          </CardContent>
        </Card>

        {currentStep === 1 && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {classes.map((cls, index) => (
                <Card key={cls.id} className={`${CARD_GRADIENTS[index % CARD_GRADIENTS.length]} rounded-3xl shadow-xl text-white`}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={cls.name}
                        onChange={(event) => updateClassName(cls.id, event.target.value)}
                        className="text-2xl font-fredoka bg-transparent border-none text-white placeholder-white"
                      />
                      <Badge className="bg-white text-gray-700 font-bold whitespace-nowrap">{cls.samples.length} gambar</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="border-4 border-dashed border-white rounded-2xl p-8 text-center mb-6 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.currentTarget.classList.add("drag-over");
                      }}
                      onDragLeave={(event) => {
                        event.currentTarget.classList.remove("drag-over");
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        event.currentTarget.classList.remove("drag-over");
                        handleFileUpload(event.dataTransfer.files, cls.id).catch(() => {
                          toast({
                            title: "Upload gagal",
                            description: "Terjadi kesalahan saat memproses gambar.",
                            variant: "destructive",
                          });
                        });
                      }}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.multiple = true;
                        input.accept = "image/*";
                        input.onchange = (event) => {
                          const files = (event.target as HTMLInputElement).files;
                          if (files) {
                            handleFileUpload(files, cls.id).catch(() => {
                              toast({
                                title: "Upload gagal",
                                description: "Terjadi kesalahan saat memproses gambar.",
                                variant: "destructive",
                              });
                            });
                          }
                        };
                        input.click();
                      }}
                    >
                      <Upload className="h-10 w-10 mb-4 mx-auto" />
                      <p className="text-lg font-bold mb-2">Seret gambar ke sini</p>
                      <p className="opacity-75">atau klik untuk memilih file</p>
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        onClick={() => {
                          setActiveClassId(cls.id);
                          setShowWebcam(true);
                        }}
                        className="flex-1 bg-white text-gray-700 hover:bg-opacity-90 transition-all"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Ambil Foto
                      </Button>
                      <Button
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.multiple = true;
                          input.accept = "image/*";
                          input.onchange = (event) => {
                            const files = (event.target as HTMLInputElement).files;
                            if (files) {
                              handleFileUpload(files, cls.id).catch(() => {
                                toast({
                                  title: "Upload gagal",
                                  description: "Terjadi kesalahan saat memproses gambar.",
                                  variant: "destructive",
                                });
                              });
                            }
                          };
                          input.click();
                        }}
                        className="flex-1 bg-white text-gray-700 hover:bg-opacity-90 transition-all"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Pilih File
                      </Button>
                    </div>

                    {cls.samples.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-bold mb-2">Contoh Gambar:</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {cls.samples.slice(0, 4).map((sample) => (
                            <div key={sample.id} className="aspect-square bg-white rounded-lg overflow-hidden">
                              <img src={sample.data} alt="Sampel" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {cls.samples.length > 4 && (
                            <div className="aspect-square bg-white/20 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-bold">+{cls.samples.length - 4}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={addClass}
                variant="outline"
                className="bg-gray-100 text-gray-700 px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kelas Baru
              </Button>
            </div>

            <div className="text-center space-y-4">
              <Button
                onClick={handleTrainModel}
                className="bg-google-blue text-white px-8 py-4 rounded-full font-bold hover:bg-blue-600 transition-colors transform hover:scale-105 shadow-lg"
                disabled={isLoading || !canTrain}
              >
                <Play className="mr-2 h-4 w-4" />
                {isLoading ? "Memproses..." : "Latih Model AI"}
              </Button>
              <p className="text-sm text-gray-600">
                {canTrain
                  ? "Minimal 2 gambar per kelas direkomendasikan agar hasil akurat."
                  : "Tambahkan sampel di minimal 2 kelas untuk mulai training."}
              </p>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <TrainingInterface
            classes={trainableClasses}
            progress={trainingProgress}
            isTraining={Boolean(trainingProgress?.isTraining && isLoading)}
            isModelReady={isModelTrained}
            trainingError={trainingError}
            onRetry={() => {
              handleTrainModel().catch(() => {
                // handled in function
              });
            }}
            onContinue={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && (
          <TestingInterface
            classes={testableClasses}
            isModelReady={isModelTrained}
            isProcessing={isLoading}
            onPredict={predictImage}
            onDownloadModel={downloadModel}
          />
        )}

        {showWebcam && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4">
              <WebcamCapture
                onCapture={handleWebcamCapture}
                onClose={() => {
                  setShowWebcam(false);
                  setActiveClassId(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
