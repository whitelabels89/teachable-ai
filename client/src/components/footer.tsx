import { Link } from "wouter";
import { Bot } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-dark-text text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-google-blue rounded-full flex items-center justify-center">
                <Bot className="text-white" />
              </div>
              <span className="text-xl font-fredoka">AI Lab</span>
            </div>
            <p className="text-gray-400">Platform pembelajaran AI yang menyenangkan untuk murid-murid Indonesia.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Pelajaran</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/image-classifier" className="hover:text-white transition-colors">Klasifikasi Gambar</Link></li>
              <li><Link href="/sound-classifier" className="hover:text-white transition-colors">Pengenalan Suara</Link></li>
              <li><Link href="/pose-classifier" className="hover:text-white transition-colors">Deteksi Gerakan</Link></li>
              <li><Link href="/gallery" className="hover:text-white transition-colors">Galeri Proyek</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Bantuan</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#tutorial" className="hover:text-white transition-colors">Panduan Memulai</a></li>
              <li><a href="#video" className="hover:text-white transition-colors">Tutorial Video</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Hubungi Kami</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Teknologi</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="https://tensorflow.org/js" className="hover:text-white transition-colors">TensorFlow.js</a></li>
              <li><a href="#ml" className="hover:text-white transition-colors">Machine Learning</a></li>
              <li><a href="#ai" className="hover:text-white transition-colors">Web AI</a></li>
              <li><a href="#opensource" className="hover:text-white transition-colors">Open Source</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 AI Lab Platform. Dibuat dengan ❤️ untuk pendidikan Indonesia.</p>
        </div>
      </div>
    </footer>
  );
}
