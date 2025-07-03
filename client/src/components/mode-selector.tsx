import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Camera, Mic, UserCheck, Play } from "lucide-react";

const modes = [
  {
    id: "image",
    title: "Gambar",
    description: "Ajari komputer mengenali objek, hewan, atau wajah dari foto!",
    icon: Camera,
    difficulty: "Mudah",
    duration: "5 menit",
    color: "from-google-blue to-purple",
    borderColor: "hover:border-google-blue",
    buttonColor: "bg-google-blue hover:bg-blue-600",
    path: "/image-classifier"
  },
  {
    id: "sound",
    title: "Suara",
    description: "Latih komputer untuk mengenali suara, musik, atau kata-kata!",
    icon: Mic,
    difficulty: "Sedang",
    duration: "7 menit",
    color: "from-success-green to-sunny-yellow",
    borderColor: "hover:border-success-green",
    buttonColor: "bg-success-green hover:bg-green-600",
    path: "/sound-classifier"
  },
  {
    id: "pose",
    title: "Gerakan",
    description: "Ajarkan komputer mengenali pose tubuh dan gerakan tangan!",
    icon: UserCheck,
    difficulty: "Menantang",
    duration: "10 menit",
    color: "from-purple to-orange",
    borderColor: "hover:border-purple",
    buttonColor: "bg-purple hover:bg-purple-600",
    path: "/pose-classifier"
  }
];

export default function ModeSelector() {
  const [, setLocation] = useLocation();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Mudah": return "bg-success-green";
      case "Sedang": return "bg-orange";
      case "Menantang": return "bg-alert-red";
      default: return "bg-gray-500";
    }
  };

  return (
    <section className="py-16 bg-light-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-fredoka text-dark-text mb-4">Pilih Mode Eksperimen</h2>
          <p className="text-gray-600 text-lg">Mau mengajarkan komputer hal apa hari ini?</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Card 
                key={mode.id}
                className={`rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer border-4 border-transparent ${mode.borderColor}`}
                onClick={() => setLocation(mode.path)}
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-24 h-24 bg-gradient-to-r ${mode.color} rounded-full mx-auto mb-6 flex items-center justify-center`}>
                    <Icon className="text-white text-3xl" />
                  </div>
                  <h3 className="text-2xl font-fredoka text-dark-text mb-4">{mode.title}</h3>
                  <p className="text-gray-600 mb-6">{mode.description}</p>
                  <div className="flex justify-center space-x-2 mb-6">
                    <Badge className={`${getDifficultyColor(mode.difficulty)} text-white`}>
                      {mode.difficulty}
                    </Badge>
                    <Badge variant="outline" className="bg-sunny-yellow text-dark-text border-sunny-yellow">
                      {mode.duration}
                    </Badge>
                  </div>
                  <Button className={`${mode.buttonColor} text-white px-6 py-3 rounded-full font-bold transition-colors w-full`}>
                    <Play className="mr-2 h-4 w-4" />
                    Mulai Eksperimen
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
