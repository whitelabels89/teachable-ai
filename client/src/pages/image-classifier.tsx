import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Project, type InsertProject } from "@shared/schema";
import { saveProject, getProjects } from "@/lib/storage-utils";
import { useTensorFlow } from "@/hooks/use-tensorflow";
import WebcamCapture from "@/components/webcam-capture";
import TrainingInterface from "@/components/training-interface";
import TestingInterface from "@/components/testing-interface";
import { Plus, Upload, Camera, Play, Brain, TestTube } from "lucide-react";

const STEPS = [
  { id: 1, title: "Kumpulkan", icon: Upload },
  { id: 2, title: "Latih", icon: Brain },
  { id: 3, title: "Uji", icon: TestTube }
];

export default function ImageClassifier() {
  const [currentStep, setCurrentStep] = useState(1);
  const [project, setProject] = useState<Project | null>(null);
  const [classes, setClasses] = useState([
    { id: "class1", name: "Kucing 🐱", samples: [] },
    { id: "class2", name: "Anjing 🐶", samples: [] }
  ]);
  const [showWebcam, setShowWebcam] = useState(false);
  const [activeClass, setActiveClass] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { loadModel, trainModel, predictImage, isLoading } = useTensorFlow();

  const saveMutation = useMutation({
    mutationFn: saveProject,
    onSuccess: () => {
      toast({
        title: "Proyek Disimpan!",
        description: "Proyek berhasil disimpan ke penyimpanan lokal.",
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast({
        title: "Gagal Menyimpan",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = async (files: FileList, classId: string) => {
    const classIndex = classes.findIndex(c => c.id === classId);
    if (classIndex === -1) return;

    const newSamples = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const sample = {
            id: Date.now() + i,
            type: 'file' as const,
            data: e.target?.result as string,
            timestamp: Date.now()
          };
          newSamples.push(sample);
        };
        reader.readAsDataURL(file);
      }
    }

    // Wait for all files to be read
    await new Promise(resolve => setTimeout(resolve, 100));

    const updatedClasses = [...classes];
    updatedClasses[classIndex].samples = [...updatedClasses[classIndex].samples, ...newSamples];
    setClasses(updatedClasses);

    toast({
      title: "Gambar Ditambahkan!",
      description: `${newSamples.length} gambar berhasil ditambahkan ke kelas ${updatedClasses[classIndex].name}`,
    });
  };

  const handleWebcamCapture = (imageData: string) => {
    if (!activeClass) return;

    const classIndex = classes.findIndex(c => c.id === activeClass);
    if (classIndex === -1) return;

    const sample = {
      id: Date.now(),
      type: 'webcam' as const,
      data: imageData,
      timestamp: Date.now()
    };

    const updatedClasses = [...classes];
    updatedClasses[classIndex].samples = [...updatedClasses[classIndex].samples, sample];
    setClasses(updatedClasses);

    toast({
      title: "Foto Diambil!",
      description: `Foto berhasil ditambahkan ke kelas ${updatedClasses[classIndex].name}`,
    });
  };

  const handleTrainModel = async () => {
    if (classes.every(c => c.samples.length === 0)) {
      toast({
        title: "Tidak Ada Data",
        description: "Tambahkan beberapa gambar ke setiap kelas sebelum melatih model.",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep(2);
    await trainModel(classes);
    setCurrentStep(3);
  };

  const addClass = () => {
    const newClass = {
      id: `class${classes.length + 1}`,
      name: `Kelas ${classes.length + 1}`,
      samples: []
    };
    setClasses([...classes, newClass]);
  };

  const updateClassName = (classId: string, newName: string) => {
    const updatedClasses = classes.map(c => 
      c.id === classId ? { ...c, name: newName } : c
    );
    setClasses(updatedClasses);
  };

  const getStepColor = (step: number) => {
    if (step < currentStep) return "bg-success-green";
    if (step === currentStep) return "bg-google-blue";
    return "bg-gray-300";
  };

  const canProceedToTraining = classes.some(c => c.samples.length > 0);

  return (
    <div className="min-h-screen bg-light-gray py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-fredoka text-dark-text mb-4">Klasifikasi Gambar</h1>
          <p className="text-gray-600 text-lg">Ikuti 3 langkah mudah untuk mengajarkan komputer mengenali gambar!</p>
        </div>

        {/* Step Progress */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`w-12 h-12 ${getStepColor(step.id)} rounded-full flex items-center justify-center text-white font-bold`}>
                    {step.id <= currentStep ? <Icon className="h-6 w-6" /> : step.id}
                  </div>
                  <span className={`ml-2 font-bold ${step.id <= currentStep ? 'text-google-blue' : 'text-gray-400'}`}>
                    {step.title}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 h-1 mx-4 rounded ${step.id < currentStep ? 'bg-success-green' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Data Collection */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {classes.map((cls, index) => (
                <Card key={cls.id} className={`rounded-3xl shadow-xl ${index === 0 ? 'bg-gradient-to-br from-success-green to-green-400' : 'bg-gradient-to-br from-orange to-yellow-400'} text-white`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Input
                        value={cls.name}
                        onChange={(e) => updateClassName(cls.id, e.target.value)}
                        className="text-2xl font-fredoka bg-transparent border-none text-white placeholder-white"
                      />
                      <Badge className="bg-white text-gray-700 font-bold">
                        {cls.samples.length} gambar
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Drag and Drop Zone */}
                    <div 
                      className="border-4 border-dashed border-white rounded-2xl p-8 text-center mb-6 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('drag-over');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('drag-over');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('drag-over');
                        const files = e.dataTransfer.files;
                        handleFileUpload(files, cls.id);
                      }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files;
                          if (files) handleFileUpload(files, cls.id);
                        };
                        input.click();
                      }}
                    >
                      <Upload className="text-4xl mb-4 mx-auto" />
                      <p className="text-lg font-bold mb-2">Seret gambar ke sini</p>
                      <p className="opacity-75">atau klik untuk memilih file</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                      <Button
                        onClick={() => {
                          setActiveClass(cls.id);
                          setShowWebcam(true);
                        }}
                        className="flex-1 bg-white text-gray-700 hover:bg-opacity-90 transition-all"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Ambil Foto
                      </Button>
                      <Button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.multiple = true;
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) handleFileUpload(files, cls.id);
                          };
                          input.click();
                        }}
                        className="flex-1 bg-white text-gray-700 hover:bg-opacity-90 transition-all"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Pilih File
                      </Button>
                    </div>

                    {/* Sample Images Preview */}
                    {cls.samples.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-bold mb-2">Gambar yang Ditambahkan:</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {cls.samples.slice(0, 4).map((sample) => (
                            <div key={sample.id} className="aspect-square bg-white rounded-lg overflow-hidden">
                              <img
                                src={sample.data}
                                alt="Sample"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {cls.samples.length > 4 && (
                            <div className="aspect-square bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
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

            {/* Add Class Button */}
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

            {/* Training Button */}
            {canProceedToTraining && (
              <div className="text-center">
                <Button
                  onClick={handleTrainModel}
                  className="bg-google-blue text-white px-8 py-4 rounded-full font-bold hover:bg-blue-600 transition-colors transform hover:scale-105 shadow-lg"
                  disabled={isLoading}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Latih Model AI
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Training */}
        {currentStep === 2 && (
          <TrainingInterface classes={classes} onComplete={() => setCurrentStep(3)} />
        )}

        {/* Step 3: Testing */}
        {currentStep === 3 && (
          <TestingInterface classes={classes} />
        )}

        {/* Webcam Modal */}
        {showWebcam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4">
              <WebcamCapture
                onCapture={handleWebcamCapture}
                onClose={() => {
                  setShowWebcam(false);
                  setActiveClass(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
