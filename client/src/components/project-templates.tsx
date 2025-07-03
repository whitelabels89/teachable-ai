import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

const templates = [
  {
    id: "animals",
    title: "Pengenal Hewan",
    description: "Belajar mengenali berbagai hewan lucu seperti kucing, anjing, kelinci, dan rubah!",
    emoji: "🐱🐶🐰🦊",
    difficulty: "Mudah",
    gradient: "from-green-400 to-blue-500",
    difficultyColor: "bg-success-green",
    path: "/image-classifier?template=animals"
  },
  {
    id: "food",
    title: "Pengenal Makanan",
    description: "Ajari komputer mengenali buah dan sayuran favorit kamu!",
    emoji: "🍎🍌🍇🥕",
    difficulty: "Sedang",
    gradient: "from-red-400 to-yellow-500",
    difficultyColor: "bg-orange",
    path: "/image-classifier?template=food"
  },
  {
    id: "gestures",
    title: "Pengenal Gerakan",
    description: "Buat komputer mengerti gerakan tangan seperti rock, paper, scissors!",
    emoji: "✊✋✌️📄",
    difficulty: "Sulit",
    gradient: "from-purple-400 to-pink-500",
    difficultyColor: "bg-alert-red",
    path: "/pose-classifier?template=gestures"
  },
  {
    id: "toys",
    title: "Pengenal Mainan",
    description: "Klasifikasi mainan favoritmu seperti boneka, mobil, dan bola!",
    emoji: "🧸🚗🎾⚽",
    difficulty: "Mudah",
    gradient: "from-blue-400 to-green-500",
    difficultyColor: "bg-success-green",
    path: "/image-classifier?template=toys"
  },
  {
    id: "emotions",
    title: "Pengenal Emosi",
    description: "Ajari komputer mengenali ekspresi wajah dan emosi!",
    emoji: "😊😢😠😲",
    difficulty: "Sedang",
    gradient: "from-yellow-400 to-red-500",
    difficultyColor: "bg-orange",
    path: "/image-classifier?template=emotions"
  },
  {
    id: "sounds",
    title: "Pengenal Suara",
    description: "Klasifikasi suara-suara berbeda seperti tepuk tangan, siulan, dan lainnya!",
    emoji: "🎵🔊🎶🎤",
    difficulty: "Sedang",
    gradient: "from-indigo-400 to-purple-500",
    difficultyColor: "bg-purple",
    path: "/sound-classifier?template=sounds"
  }
];

export default function ProjectTemplates() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-16 bg-gradient-to-br from-sunny-yellow to-orange">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-fredoka text-white mb-4">Proyek Template</h2>
          <p className="text-white opacity-90 text-lg">Coba proyek-proyek seru yang sudah kami siapkan!</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => (
            <Card 
              key={template.id}
              className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
              onClick={() => setLocation(template.path)}
            >
              <CardContent className="p-6">
                <div className={`aspect-video bg-gradient-to-br ${template.gradient} rounded-2xl mb-4 flex items-center justify-center text-white text-4xl`}>
                  {template.emoji}
                </div>
                <h3 className="text-xl font-fredoka text-dark-text mb-2">{template.title}</h3>
                <p className="text-gray-600 mb-4">{template.description}</p>
                <div className="flex justify-between items-center">
                  <Badge className={`${template.difficultyColor} text-white`}>
                    {template.difficulty}
                  </Badge>
                  <Button className="bg-google-blue text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all hover:shadow-lg transform hover:scale-105 h-12">
                    Coba Sekarang
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
