import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Play, Square, Upload, Volume2 } from "lucide-react";

export default function SoundClassifier() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSounds, setRecordedSounds] = useState<string[]>([]);

  const handleStartRecording = () => {
    setIsRecording(true);
    // TODO: Implement Web Audio API recording
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // TODO: Save recorded audio
  };

  return (
    <div className="min-h-screen bg-light-gray py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-fredoka text-dark-text mb-4">Klasifikasi Suara</h1>
          <p className="text-gray-600 text-lg">Ajari komputer mengenali berbagai suara dan musik!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Sound Class 1 */}
          <Card className="bg-gradient-to-br from-success-green to-green-400 text-white rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-fredoka">Kelas 1: Tepuk Tangan 👏</CardTitle>
              <Badge className="bg-white text-success-green font-bold w-fit">
                0 rekaman
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-4 border-dashed border-white rounded-2xl p-8 text-center">
                  <Mic className="text-4xl mb-4 mx-auto" />
                  <p className="text-lg font-bold mb-2">Rekam suara tepuk tangan</p>
                  <p className="opacity-75">Klik untuk mulai merekam</p>
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    onClick={handleStartRecording}
                    className="flex-1 bg-white text-success-green hover:bg-opacity-90 transition-all"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Rekam Suara
                  </Button>
                  <Button
                    className="flex-1 bg-white text-success-green hover:bg-opacity-90 transition-all"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sound Class 2 */}
          <Card className="bg-gradient-to-br from-orange to-yellow-400 text-white rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-fredoka">Kelas 2: Siulan 🎵</CardTitle>
              <Badge className="bg-white text-orange font-bold w-fit">
                0 rekaman
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-4 border-dashed border-white rounded-2xl p-8 text-center">
                  <Volume2 className="text-4xl mb-4 mx-auto" />
                  <p className="text-lg font-bold mb-2">Rekam suara siulan</p>
                  <p className="opacity-75">Klik untuk mulai merekam</p>
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    onClick={handleStartRecording}
                    className="flex-1 bg-white text-orange hover:bg-opacity-90 transition-all"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Rekam Suara
                  </Button>
                  <Button
                    className="flex-1 bg-white text-orange hover:bg-opacity-90 transition-all"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-purple to-pink-400 text-white rounded-3xl shadow-xl max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="text-6xl mb-4">🎤</div>
              <h3 className="text-2xl font-fredoka mb-4">Fitur Klasifikasi Suara</h3>
              <p className="text-lg mb-6">
                Fitur ini sedang dalam pengembangan! Segera kamu bisa mengajarkan komputer 
                mengenali berbagai suara seperti musik, suara hewan, dan lainnya.
              </p>
              <Badge className="bg-white text-purple font-bold">
                Segera Hadir
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
