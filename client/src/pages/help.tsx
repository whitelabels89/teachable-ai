import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  Play, 
  Camera, 
  Upload, 
  Brain, 
  TestTube, 
  Award,
  BookOpen,
  Video,
  MessageCircle
} from "lucide-react";

const helpSections = [
  {
    id: "getting-started",
    title: "Memulai Petualangan AI",
    icon: Play,
    color: "from-google-blue to-purple",
    steps: [
      {
        title: "Pilih Mode Pembelajaran",
        description: "Mulai dengan memilih salah satu dari 3 mode: Gambar, Suara, atau Gerakan",
        tip: "Mode Gambar paling mudah untuk pemula!"
      },
      {
        title: "Kumpulkan Data",
        description: "Upload gambar atau ambil foto dengan webcam untuk mengajarkan AI",
        tip: "Semakin banyak contoh, semakin pintar AI kamu!"
      },
      {
        title: "Latih Model",
        description: "Biarkan komputer belajar dari data yang kamu berikan",
        tip: "Proses ini membutuhkan waktu beberapa detik hingga menit"
      },
      {
        title: "Uji Hasil",
        description: "Coba model AI kamu dengan gambar baru untuk melihat seberapa pintar dia",
        tip: "Jika hasilnya kurang bagus, tambah lebih banyak data!"
      }
    ]
  },
  {
    id: "image-classifier",
    title: "Panduan Klasifikasi Gambar",
    icon: Camera,
    color: "from-success-green to-blue-500",
    steps: [
      {
        title: "Membuat Kelas",
        description: "Berikan nama untuk setiap kategori yang ingin dikenali AI",
        tip: "Nama yang jelas membantu kamu mengingat apa yang sedang diajarkan"
      },
      {
        title: "Upload Gambar",
        description: "Seret dan lepas gambar atau klik untuk memilih file dari komputer",
        tip: "Gunakan gambar yang jelas dan berbeda-beda sudut pandang"
      },
      {
        title: "Gunakan Webcam",
        description: "Ambil foto langsung dengan kamera untuk data yang lebih beragam",
        tip: "Foto dengan pencahayaan berbeda membuat AI lebih pintar"
      },
      {
        title: "Training Model",
        description: "Klik 'Latih Model AI' setelah semua kelas punya cukup gambar",
        tip: "Minimal 3-5 gambar per kelas untuk hasil yang baik"
      }
    ]
  },
  {
    id: "tips-tricks",
    title: "Tips & Trik",
    icon: Award,
    color: "from-orange to-yellow-500",
    steps: [
      {
        title: "Pilih Gambar Berkualitas",
        description: "Gunakan gambar yang jelas, terang, dan fokus pada objek utama",
        tip: "Hindari gambar yang buram atau terlalu gelap"
      },
      {
        title: "Variasi Data",
        description: "Ambil foto dari berbagai sudut, jarak, dan kondisi pencahayaan",
        tip: "Semakin beragam data, semakin pintar AI kamu!"
      },
      {
        title: "Jumlah Data Seimbang",
        description: "Pastikan setiap kelas memiliki jumlah contoh yang hampir sama",
        tip: "Jika satu kelas punya 10 gambar, yang lain juga sebaiknya sekitar 10"
      },
      {
        title: "Test Secara Berkala",
        description: "Uji model dengan gambar baru untuk melihat performanya",
        tip: "Jika akurasi rendah, tambah lebih banyak data training"
      }
    ]
  },
  {
    id: "troubleshooting",
    title: "Pemecahan Masalah",
    icon: HelpCircle,
    color: "from-alert-red to-orange",
    steps: [
      {
        title: "Model Tidak Akurat",
        description: "Jika prediksi sering salah, tambah lebih banyak contoh gambar",
        tip: "Coba gunakan gambar dengan latar belakang yang berbeda"
      },
      {
        title: "Webcam Tidak Berfungsi",
        description: "Pastikan browser sudah memberikan izin akses kamera",
        tip: "Coba refresh halaman dan izinkan akses kamera"
      },
      {
        title: "Training Lambat",
        description: "Proses training membutuhkan waktu, terutama dengan banyak data",
        tip: "Sabar ya! Komputer sedang belajar keras"
      },
      {
        title: "Gambar Tidak Ter-upload",
        description: "Pastikan format file adalah JPG, PNG, atau gambar lainnya",
        tip: "Ukuran file terlalu besar? Coba kompres dulu"
      }
    ]
  }
];

const videoTutorials = [
  {
    title: "Cara Membuat Proyek Pertama",
    duration: "5 menit",
    difficulty: "Pemula",
    description: "Pelajari langkah dasar membuat klasifikasi gambar"
  },
  {
    title: "Tips Mengambil Foto yang Baik",
    duration: "3 menit", 
    difficulty: "Pemula",
    description: "Teknik fotografi sederhana untuk data yang berkualitas"
  },
  {
    title: "Membuat AI Pengenal Hewan",
    duration: "8 menit",
    difficulty: "Menengah", 
    description: "Tutorial lengkap membuat AI yang bisa mengenali berbagai hewan"
  }
];

export default function Help() {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Pemula": return "bg-success-green";
      case "Menengah": return "bg-orange";
      case "Lanjutan": return "bg-alert-red";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-light-gray py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-fredoka text-dark-text mb-4">Pusat Bantuan AI Lab</h1>
          <p className="text-gray-600 text-lg">Panduan lengkap untuk menjadi peneliti AI cilik!</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-r from-google-blue to-purple text-white rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
            <CardContent className="p-6 text-center">
              <BookOpen className="text-4xl mb-4 mx-auto" />
              <h3 className="text-xl font-fredoka mb-2">Panduan Pemula</h3>
              <p className="opacity-90 mb-4">Mulai dari dasar-dasar AI</p>
              <Button className="bg-white text-google-blue hover:bg-gray-100 transition-all h-12 w-full font-semibold">
                Baca Sekarang
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-success-green to-blue-500 text-white rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
            <CardContent className="p-6 text-center">
              <Video className="text-4xl mb-4 mx-auto" />
              <h3 className="text-xl font-fredoka mb-2">Video Tutorial</h3>
              <p className="opacity-90 mb-4">Belajar lewat video seru</p>
              <Button className="bg-white text-success-green hover:bg-gray-100 transition-all h-12 w-full font-semibold">
                Tonton Video
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange to-yellow-500 text-white rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
            <CardContent className="p-6 text-center">
              <MessageCircle className="text-4xl mb-4 mx-auto" />
              <h3 className="text-xl font-fredoka mb-2">Tanya Jawab</h3>
              <p className="opacity-90 mb-4">Punya pertanyaan? Tanya di sini</p>
              <Button className="bg-white text-orange hover:bg-gray-100 transition-all h-12 w-full font-semibold">
                Ajukan Pertanyaan
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Sections */}
        <div className="space-y-8">
          {helpSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} className="bg-white rounded-3xl shadow-xl">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${section.color} rounded-full flex items-center justify-center`}>
                      <Icon className="text-white text-2xl" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-fredoka text-dark-text">{section.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {section.steps.map((step, index) => (
                      <div key={index} className="bg-light-gray rounded-2xl p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 bg-google-blue rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-fredoka text-dark-text mb-2">{step.title}</h4>
                            <p className="text-gray-600 mb-3">{step.description}</p>
                            <div className="bg-sunny-yellow bg-opacity-20 rounded-lg p-3">
                              <p className="text-sm text-dark-text font-medium">
                                💡 <strong>Tips:</strong> {step.tip}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Video Tutorials */}
        <div className="mt-12">
          <h2 className="text-3xl font-fredoka text-dark-text text-center mb-8">Video Tutorial</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {videoTutorials.map((video, index) => (
              <Card key={index} className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                <CardContent className="p-6">
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4 flex items-center justify-center">
                    <Play className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-fredoka text-dark-text mb-2">{video.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{video.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <Badge className={`${getDifficultyColor(video.difficulty)} text-white`}>
                      {video.difficulty}
                    </Badge>
                    <span className="text-sm text-gray-500">{video.duration}</span>
                  </div>
                  <Button className="bg-google-blue text-white hover:bg-blue-600 transition-all h-12 w-full font-semibold">
                    <Play className="mr-2 h-4 w-4" />
                    Tonton Video
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-purple to-pink-400 text-white rounded-3xl shadow-xl max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-fredoka mb-4">Masih Butuh Bantuan?</h3>
              <p className="text-lg opacity-90 mb-6">
                Tim AI Lab siap membantu kamu! Jangan ragu untuk bertanya jika ada yang kurang jelas.
              </p>
              <div className="flex justify-center space-x-4">
                <Button className="bg-white text-purple hover:bg-gray-100 transition-all h-12 px-6 font-semibold">
                  📧 Email Kami
                </Button>
                <Button className="bg-white text-purple hover:bg-gray-100 transition-all h-12 px-6 font-semibold">
                  💬 Live Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}