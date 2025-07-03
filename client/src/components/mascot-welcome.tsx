import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Play, Lightbulb } from "lucide-react";

export default function MascotWelcome() {
  const [, setLocation] = useLocation();

  const handleStartAdventure = () => {
    setLocation("/image-classifier");
  };

  return (
    <section className="py-8 bg-gradient-to-r from-google-blue to-purple text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 text-center md:text-left mb-6 md:mb-0">
            <h2 className="text-4xl md:text-5xl font-fredoka mb-4">
              Halo, Peneliti Kecil! 👋
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Ayo belajar mengajar komputer untuk mengenali gambar, suara, dan gerakan dengan cara yang menyenangkan!
            </p>
            <Button 
              onClick={handleStartAdventure}
              className="bg-sunny-yellow text-dark-text px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange transition-all transform hover:scale-105 shadow-lg h-14"
            >
              <Play className="mr-2 h-5 w-5" />
              Mulai Petualangan!
            </Button>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 bg-white rounded-full shadow-2xl flex items-center justify-center animate-bounce-slow">
                <div className="text-8xl animate-pulse-slow">🤖</div>
              </div>
              <div className="absolute -top-4 -right-4 bg-sunny-yellow rounded-full w-16 h-16 flex items-center justify-center animate-wiggle">
                <Lightbulb className="text-orange text-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
