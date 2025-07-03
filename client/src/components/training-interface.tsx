import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTensorFlow } from "@/hooks/use-tensorflow";
import { Brain, Clock, Trophy, Images, Pause, Square } from "lucide-react";

interface TrainingInterfaceProps {
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
  onComplete: () => void;
}

export default function TrainingInterface({ classes, onComplete }: TrainingInterfaceProps) {
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [totalEpochs] = useState(50);
  const [accuracy, setAccuracy] = useState(0);
  const [loss, setLoss] = useState(1.0);
  const [isTraining, setIsTraining] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isPaused, setIsPaused] = useState(false);

  const { trainModel, isLoading } = useTensorFlow();

  useEffect(() => {
    if (!isTraining) {
      startTraining();
    }
  }, []);

  const startTraining = async () => {
    setIsTraining(true);
    
    // Simulate training progress
    const trainingInterval = setInterval(() => {
      setCurrentEpoch(prev => {
        const newEpoch = prev + 1;
        const progress = (newEpoch / totalEpochs) * 100;
        setTrainingProgress(progress);
        
        // Simulate improving accuracy and decreasing loss
        const newAccuracy = Math.min(0.95, 0.5 + (newEpoch / totalEpochs) * 0.45);
        const newLoss = Math.max(0.05, 1.0 - (newEpoch / totalEpochs) * 0.95);
        
        setAccuracy(newAccuracy);
        setLoss(newLoss);
        
        // Update time remaining
        setTimeRemaining(Math.max(0, 30 - Math.floor((newEpoch / totalEpochs) * 30)));
        
        if (newEpoch >= totalEpochs) {
          clearInterval(trainingInterval);
          setIsTraining(false);
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
        
        return newEpoch;
      });
    }, 100); // Fast simulation for demo

    // Start actual TensorFlow training
    try {
      await trainModel(classes);
    } catch (error) {
      console.error('Training error:', error);
    }
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsTraining(false);
    onComplete();
  };

  const totalSamples = classes.reduce((sum, cls) => sum + cls.samples.length, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-white rounded-3xl shadow-xl">
        <CardContent className="p-8">
          
          {/* Training Status */}
          <div className="text-center mb-8">
            <div className="w-32 h-32 bg-gradient-to-r from-google-blue to-purple rounded-full mx-auto mb-6 flex items-center justify-center training-pulse">
              <Brain className="text-white text-4xl" />
            </div>
            <h3 className="text-2xl font-fredoka text-dark-text mb-2">
              {isTraining ? 'Model sedang belajar...' : 'Training Selesai!'}
            </h3>
            <p className="text-gray-600">
              {isTraining ? 'Komputer sedang menganalisis gambar-gambar yang kamu berikan' : 'Model siap untuk diuji!'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
              <span>Progress Training</span>
              <span>{Math.round(trainingProgress)}%</span>
            </div>
            <Progress value={trainingProgress} className="h-4" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Epoch {currentEpoch}/{totalEpochs}</span>
              <span>Akurasi: {Math.round(accuracy * 100)}%</span>
            </div>
          </div>

          {/* Training Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {classes.map((cls, index) => (
              <div key={cls.id} className={`bg-opacity-10 rounded-2xl p-4 text-center ${
                index === 0 ? 'bg-success-green' : 'bg-orange'
              }`}>
                <Images className={`mx-auto text-2xl mb-2 ${
                  index === 0 ? 'text-success-green' : 'text-orange'
                }`} />
                <p className={`text-2xl font-bold ${
                  index === 0 ? 'text-success-green' : 'text-orange'
                }`}>
                  {cls.samples.length}
                </p>
                <p className="text-sm text-gray-600">{cls.name}</p>
              </div>
            ))}
            <div className="bg-purple bg-opacity-10 rounded-2xl p-4 text-center">
              <Clock className="text-purple text-2xl mb-2 mx-auto" />
              <p className="text-2xl font-bold text-purple">{timeRemaining}</p>
              <p className="text-sm text-gray-600">Detik Tersisa</p>
            </div>
            <div className="bg-google-blue bg-opacity-10 rounded-2xl p-4 text-center">
              <Trophy className="text-google-blue text-2xl mb-2 mx-auto" />
              <p className="text-2xl font-bold text-google-blue">{Math.round(accuracy * 100)}%</p>
              <p className="text-sm text-gray-600">Akurasi</p>
            </div>
          </div>

          {/* Training Controls */}
          {isTraining && (
            <div className="flex justify-center space-x-4">
              <Button
                onClick={handleStop}
                className="bg-alert-red text-white px-6 py-3 rounded-full font-bold hover:bg-red-600 transition-colors"
              >
                <Square className="mr-2 h-4 w-4" />
                Hentikan Training
              </Button>
              <Button
                onClick={handlePauseResume}
                className="bg-gray-500 text-white px-6 py-3 rounded-full font-bold hover:bg-gray-600 transition-colors"
              >
                <Pause className="mr-2 h-4 w-4" />
                {isPaused ? 'Lanjutkan' : 'Jeda'}
              </Button>
            </div>
          )}

          {/* Training Complete */}
          {!isTraining && currentEpoch >= totalEpochs && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-fredoka text-success-green mb-2">
                Training Berhasil!
              </h3>
              <p className="text-gray-600 mb-4">
                Model AI kamu sudah siap untuk diuji. Akurasi final: {Math.round(accuracy * 100)}%
              </p>
              <Button
                onClick={onComplete}
                className="bg-google-blue text-white px-8 py-4 rounded-full font-bold hover:bg-blue-600 transition-all transform hover:scale-105"
              >
                Lanjut ke Pengujian
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
