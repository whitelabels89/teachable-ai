import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Trophy, Images, RotateCcw, CheckCircle2 } from "lucide-react";
import type { TrainingProgress } from "@/hooks/use-tensorflow";

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
  progress: TrainingProgress | null;
  isTraining: boolean;
  isModelReady: boolean;
  trainingError: string | null;
  onRetry: () => void;
  onContinue: () => void;
}

export default function TrainingInterface({
  classes,
  progress,
  isTraining,
  isModelReady,
  trainingError,
  onRetry,
  onContinue,
}: TrainingInterfaceProps) {
  const totalSamples = classes.reduce((sum, cls) => sum + cls.samples.length, 0);
  const totalEpochs = progress?.totalEpochs ?? 35;
  const currentEpoch = progress?.epoch ?? 0;

  const progressValue =
    currentEpoch > 0 ? Math.min(100, (currentEpoch / Math.max(1, totalEpochs)) * 100) : isModelReady ? 100 : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-white rounded-3xl shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-28 h-28 bg-gradient-to-r from-google-blue to-purple rounded-full mx-auto mb-6 flex items-center justify-center training-pulse">
              {isModelReady ? <CheckCircle2 className="text-white h-12 w-12" /> : <Brain className="text-white h-12 w-12" />}
            </div>
            <h3 className="text-2xl font-fredoka text-dark-text mb-2">
              {isTraining ? "Model sedang belajar..." : isModelReady ? "Training Selesai" : "Training Belum Berhasil"}
            </h3>
            <p className="text-gray-600">{progress?.phase ?? "Siapkan data lalu mulai training"}</p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
              <span>Progress Training</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-4" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>
                Epoch {Math.min(currentEpoch, totalEpochs)}/{totalEpochs}
              </span>
              <span>Akurasi: {Math.round((progress?.accuracy ?? 0) * 100)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {classes.map((cls, index) => (
              <div
                key={cls.id}
                className={`bg-opacity-10 rounded-2xl p-4 text-center ${index % 2 === 0 ? "bg-success-green" : "bg-orange"}`}
              >
                <Images className={`mx-auto h-6 w-6 mb-2 ${index % 2 === 0 ? "text-success-green" : "text-orange"}`} />
                <p className={`text-2xl font-bold ${index % 2 === 0 ? "text-success-green" : "text-orange"}`}>
                  {cls.samples.length}
                </p>
                <p className="text-sm text-gray-600">{cls.name}</p>
              </div>
            ))}
            <div className="bg-google-blue bg-opacity-10 rounded-2xl p-4 text-center">
              <Trophy className="text-google-blue h-6 w-6 mb-2 mx-auto" />
              <p className="text-2xl font-bold text-google-blue">{Math.round((progress?.accuracy ?? 0) * 100)}%</p>
              <p className="text-sm text-gray-600">Akurasi</p>
            </div>
            <div className="bg-purple bg-opacity-10 rounded-2xl p-4 text-center">
              <Brain className="text-purple h-6 w-6 mb-2 mx-auto" />
              <p className="text-2xl font-bold text-purple">{totalSamples}</p>
              <p className="text-sm text-gray-600">Total Sampel</p>
            </div>
          </div>

          {trainingError && (
            <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {trainingError}
            </div>
          )}

          <div className="flex justify-center gap-4">
            {!isTraining && !isModelReady && (
              <Button
                onClick={onRetry}
                className="bg-alert-red text-white px-8 py-4 rounded-full font-bold hover:bg-red-600 transition-colors"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Coba Training Lagi
              </Button>
            )}

            {!isTraining && isModelReady && (
              <Button
                onClick={onContinue}
                className="bg-google-blue text-white px-8 py-4 rounded-full font-bold hover:bg-blue-600 transition-colors"
              >
                Lanjut ke Pengujian
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
