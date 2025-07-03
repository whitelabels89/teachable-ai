import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Camera, Play, Users } from "lucide-react";

export default function PoseClassifier() {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleStartCapture = () => {
    setIsCapturing(true);
    // TODO: Implement pose detection with TensorFlow.js PoseNet
  };

  return (
    <div className="min-h-screen bg-light-gray py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-fredoka text-dark-text mb-4">Klasifikasi Gerakan</h1>
          <p className="text-gray-600 text-lg">Ajari komputer mengenali pose tubuh dan gerakan tangan!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pose Class 1 */}
          <Card className="bg-gradient-to-br from-purple to-pink-400 text-white rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-fredoka">Pose 1: Tangan Kanan Naik ✋</CardTitle>
              <Badge className="bg-white text-purple font-bold w-fit">
                0 pose
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-4 border-dashed border-white rounded-2xl p-8 text-center">
                  <UserCheck className="text-4xl mb-4 mx-auto" />
                  <p className="text-lg font-bold mb-2">Lakukan pose tangan kanan naik</p>
                  <p className="opacity-75">Klik untuk mulai merekam gerakan</p>
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    onClick={handleStartCapture}
                    className="flex-1 bg-white text-purple hover:bg-opacity-90 transition-all"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Rekam Gerakan
                  </Button>
                  <Button
                    className="flex-1 bg-white text-purple hover:bg-opacity-90 transition-all"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Lihat Contoh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pose Class 2 */}
          <Card className="bg-gradient-to-br from-google-blue to-blue-600 text-white rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-fredoka">Pose 2: Tangan Kiri Naik ✋</CardTitle>
              <Badge className="bg-white text-google-blue font-bold w-fit">
                0 pose
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-4 border-dashed border-white rounded-2xl p-8 text-center">
                  <Users className="text-4xl mb-4 mx-auto" />
                  <p className="text-lg font-bold mb-2">Lakukan pose tangan kiri naik</p>
                  <p className="opacity-75">Klik untuk mulai merekam gerakan</p>
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    onClick={handleStartCapture}
                    className="flex-1 bg-white text-google-blue hover:bg-opacity-90 transition-all"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Rekam Gerakan
                  </Button>
                  <Button
                    className="flex-1 bg-white text-google-blue hover:bg-opacity-90 transition-all"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Lihat Contoh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-orange to-red-400 text-white rounded-3xl shadow-xl max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="text-6xl mb-4">🤸‍♂️</div>
              <h3 className="text-2xl font-fredoka mb-4">Fitur Klasifikasi Gerakan</h3>
              <p className="text-lg mb-6">
                Fitur ini sedang dalam pengembangan! Segera kamu bisa mengajarkan komputer 
                mengenali berbagai gerakan tubuh dan pose menggunakan teknologi PoseNet.
              </p>
              <Badge className="bg-white text-orange font-bold">
                Segera Hadir
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
