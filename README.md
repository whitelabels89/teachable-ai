# AI Lab - Platform Pembelajaran AI untuk Anak Indonesia

Platform edukatif yang dirancang khusus untuk anak-anak Indonesia (usia 6-16 tahun) untuk belajar konsep kecerdasan buatan melalui eksperimen interaktif yang menyenangkan.

## 🌟 Fitur Utama

### 🖼️ Klasifikasi Gambar
- Upload foto atau ambil dari kamera
- Latih AI untuk mengenali berbagai objek
- Interface drag-and-drop yang mudah digunakan

### 🎵 Klasifikasi Suara
- Rekam suara dari mikrofon
- Upload file audio
- Ajarkan AI membedakan berbagai jenis suara

### 🤸 Klasifikasi Gerakan
- Gunakan kamera untuk mendeteksi pose
- Latih AI mengenali gerakan tubuh
- Real-time pose detection

## 🛠️ Teknologi

### Frontend
- **React 18** dengan TypeScript
- **Vite** untuk build yang cepat
- **TensorFlow.js** untuk machine learning di browser
- **Tailwind CSS** untuk styling
- **Radix UI** untuk komponen UI

### Backend
- **Express.js** dengan TypeScript
- **PostgreSQL** dengan Drizzle ORM
- **Neon Database** untuk hosting database

## 🚀 Menjalankan Project

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Database Setup
```bash
npm run db:push
```

## 📱 Browser Support

- Chrome/Chromium (Rekomendasi)
- Firefox
- Safari
- Edge

**Catatan:** Fitur kamera dan mikrofon memerlukan HTTPS untuk berfungsi di production.

## 🎯 Target Pengguna

Platform ini dirancang khusus untuk:
- Anak-anak Indonesia usia 6-16 tahun
- Guru yang ingin mengajarkan konsep AI
- Orang tua yang mendampingi anak belajar teknologi

## 🔒 Privacy & Security

- Semua pemrosesan AI dilakukan di browser (client-side)
- Tidak ada data gambar/suara yang dikirim ke server
- Model AI disimpan secara lokal

## 📄 Lisensi

MIT License - Lihat file LICENSE untuk detail lengkap.

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan buat issue atau pull request.

---

Dibuat dengan ❤️ untuk anak-anak Indonesia yang ingin belajar AI