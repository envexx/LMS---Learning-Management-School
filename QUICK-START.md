# Quick Start Guide - LMS Sistem Ujian Online

## 🚀 Cara Menjalankan Aplikasi

### 1. Stop Instance Next.js yang Sedang Berjalan

Jika Anda mendapat error "Port 3000 is in use", hentikan instance yang sedang berjalan:

**Windows (PowerShell):**
```powershell
# Cari process yang menggunakan port 3000
netstat -ano | findstr :3000

# Hentikan process (ganti PID dengan nomor yang muncul)
taskkill /PID 23308 /F
```

**Atau tekan `Ctrl + C` di terminal yang menjalankan `npm run dev`**

### 2. Jalankan Development Server

```bash
npm run dev
```

Server akan berjalan di: **http://localhost:3000**

### 3. Akses Aplikasi

Buka browser dan akses: **http://localhost:3000**

Aplikasi akan otomatis redirect ke halaman login: **http://localhost:3000/auth/login**

## 🔑 Demo Login Credentials

### Admin
- **Username:** `admin`
- **Password:** `password`
- **Redirect ke:** `/admin` (Dashboard Admin)

### Guru
- **Username:** `guru`
- **Password:** `password`
- **Redirect ke:** `/guru` (Dashboard Guru - Coming Soon)

### Siswa
- **Username:** `siswa`
- **Password:** `password`
- **Redirect ke:** `/siswa` (Dashboard Siswa - Coming Soon)

## 📍 Route yang Tersedia

### ✅ Sudah Berfungsi

#### Authentication
- `/auth/login` - Halaman login

#### Admin Panel
- `/admin` - Dashboard Admin
- `/admin/kelas` - Manajemen Kelas
- `/admin/siswa` - Manajemen Siswa
- `/admin/guru` - Manajemen Guru
- `/admin/mapel` - Manajemen Mata Pelajaran
- `/admin/token-ujian` - Token Ujian (Auto-refresh 60 detik)

### ⏳ Coming Soon
- `/admin/presensi` - Presensi Siswa
- `/admin/kartu-pelajar` - Kartu Pelajar
- `/guru/*` - Panel Guru
- `/siswa/*` - Panel Siswa
- `/profile/[nis]` - Profil Public

## 🎯 Fitur yang Sudah Dibuat

### Admin Panel
1. **Dashboard**
   - Statistik: Total Siswa, Guru, Kelas, Ujian Aktif
   - Activity Log
   - Quick Actions

2. **Manajemen Kelas**
   - CRUD Kelas
   - Fitur Naik Kelas (bulk update)
   - Filter & Search

3. **Manajemen Siswa**
   - CRUD Siswa
   - Multi-select Mata Pelajaran
   - Fitur "Pilih Semua Mapel"
   - Search & Filter
   - Import CSV (UI ready)

4. **Manajemen Guru**
   - CRUD Guru
   - Multi-select Kelas & Mapel
   - Search

5. **Manajemen Mata Pelajaran**
   - CRUD Mapel
   - Filter by Jenis (Wajib/Peminatan)
   - Search

6. **Token Ujian**
   - Toggle Aktif/Nonaktif Sistem Ujian
   - Auto-generate Token setiap 60 detik
   - Countdown Timer dengan Progress Bar
   - Copy Token Button
   - Riwayat Token (10 terakhir)
   - Log Akses (UI ready)

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Module Not Found
```bash
npm install
```

### Clear Cache
```bash
# Hapus folder .next
rm -rf .next

# Jalankan ulang
npm run dev
```

## 📚 Dokumentasi Lengkap

Lihat file `LMS-PROGRESS.md` untuk:
- Progress development lengkap
- Teknologi stack
- Struktur folder
- Fitur yang sudah & belum dibuat

## 🎨 Tech Stack

- **Framework:** Next.js 16 + TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Shadcn UI
- **Icons:** Lucide React
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod
- **HTTP Client:** Axios
- **Notifications:** Sonner

## 📝 Notes

- Aplikasi saat ini berjalan dalam **demo mode** dengan data dummy
- Backend API belum diimplementasi (menggunakan localStorage untuk auth)
- Token ujian auto-refresh setiap 60 detik ketika sistem ujian aktif
- Semua halaman sudah responsive (mobile-first design)

---

**Happy Coding! 🚀**
