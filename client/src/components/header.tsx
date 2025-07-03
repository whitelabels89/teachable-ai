import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { getUserProgress } from "@/lib/storage-utils";
import { Bot, Medal } from "lucide-react";

export default function Header() {
  const { data: progress } = useQuery({
    queryKey: ['userProgress'],
    queryFn: getUserProgress,
    staleTime: 300000, // 5 minutes
  });

  return (
    <header className="bg-white shadow-lg border-b-4 border-google-blue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-gradient-to-r from-google-blue to-purple rounded-full flex items-center justify-center">
              <Bot className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-fredoka text-google-blue">AI Lab</h1>
              <p className="text-sm text-gray-600">Teachable Machine untuk Murid</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-700 hover:text-google-blue font-semibold transition-colors">
              Beranda
            </Link>
            <Link href="/gallery" className="text-gray-700 hover:text-google-blue font-semibold transition-colors">
              Galeri
            </Link>
            <a href="#help" className="text-gray-700 hover:text-google-blue font-semibold transition-colors">
              Bantuan
            </a>
          </nav>
          
          <div className="flex items-center space-x-3">
            <div className="bg-sunny-yellow rounded-full p-2">
              <Medal className="text-orange text-xl" />
            </div>
            <Badge variant="outline" className="bg-orange text-white border-orange">
              {progress?.badges?.length || 0} Lencana
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
