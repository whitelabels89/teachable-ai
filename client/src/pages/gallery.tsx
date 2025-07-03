import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { getProjects } from "@/lib/storage-utils";
import { Search, Calendar, Eye, Trash2, Download } from "lucide-react";

export default function Gallery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    staleTime: 300000,
  });

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || project.type === selectedType;
    return matchesSearch && matchesType;
  }) || [];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "image": return "bg-google-blue";
      case "sound": return "bg-success-green";
      case "pose": return "bg-purple";
      default: return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image": return "📷";
      case "sound": return "🎵";
      case "pose": return "🤸‍♂️";
      default: return "📁";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-gray py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-google-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat proyek...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-gray py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-fredoka text-dark-text mb-4">Galeri Proyek</h1>
          <p className="text-gray-600 text-lg">Lihat semua proyek AI yang sudah kamu buat!</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari proyek..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedType === "all" ? "default" : "outline"}
              onClick={() => setSelectedType("all")}
            >
              Semua
            </Button>
            <Button
              variant={selectedType === "image" ? "default" : "outline"}
              onClick={() => setSelectedType("image")}
            >
              📷 Gambar
            </Button>
            <Button
              variant={selectedType === "sound" ? "default" : "outline"}
              onClick={() => setSelectedType("sound")}
            >
              🎵 Suara
            </Button>
            <Button
              variant={selectedType === "pose" ? "default" : "outline"}
              onClick={() => setSelectedType("pose")}
            >
              🤸‍♂️ Gerakan
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-2xl font-fredoka text-gray-600 mb-4">
              {searchTerm ? "Tidak ada proyek yang cocok" : "Belum ada proyek"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? "Coba kata kunci lain atau buat proyek baru"
                : "Mulai membuat proyek AI pertama kamu!"
              }
            </p>
            <Button className="bg-google-blue text-white hover:bg-blue-600">
              Buat Proyek Baru
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{getTypeIcon(project.type)}</div>
                      <div>
                        <CardTitle className="text-xl font-fredoka text-dark-text">
                          {project.name}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={`${getTypeColor(project.type)} text-white text-xs`}>
                            {project.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {project.classes.length} kelas
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs">
                        {new Date(project.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 text-sm">{project.description}</p>
                  
                  {/* Project Stats */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Total Sampel</span>
                      <span>{project.classes.reduce((sum, cls) => sum + cls.samples.length, 0)}</span>
                    </div>
                    {project.model.trained && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Akurasi</span>
                        <span className="text-success-green font-bold">
                          {Math.round((project.model.accuracy || 0) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-google-blue text-white hover:bg-blue-600"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Lihat
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={!project.model.trained}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Unduh
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-alert-red hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
