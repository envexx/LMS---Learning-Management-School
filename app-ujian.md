# PROMPT APLIKASI UJIAN ONLINE - FRONTEND + BACKEND

## TEKNOLOGI STACK
**Frontend:** React + Tailwind CSS + Lucide React Icons
**Backend:** Node.js/Express + MongoDB (atau Supabase)
**Auth:** JWT Token
**Database Structure:** Relational dengan MongoDB collections

---

## DATABASE SCHEMA

### Collections:
1. **users** (Admin, Guru, Siswa)
   - _id, role (admin/guru/siswa), username, password, email, nama, nomorIdentitas (NIS/NIP), status

2. **kelas**
   - _id, tingkatan (7-12), namaKelas (A,B,C), kapasitas, jumlahSiswa, status, tahunAjaran

3. **siswa**
   - _id, userId, nis, nama, email, kelas_id, mapel_ids[], foto, status, tahunAjaran

4. **guru**
   - _id, userId, nip, nama, email, kelas_ids[], mapel_ids[], status

5. **mapel**
   - _id, kode, nama, sks, jenis (wajib/peminatan), status

6. **tugas**
   - _id, guru_id, judul, deskripsi, kelas_ids[], mapel_id, deadline, attachment, status, tipe (tugas/ulangan/kuis)

7. **submission_tugas**
   - _id, tugas_id, siswa_id, file, tanggalSubmit, nilai, status

8. **ujian**
   - _id, guru_id, judul, jenis (pg/essay), kelas_ids[], mapel_id, tanggal, jamMulai, durasi, passingGrade, soal_ids[], status

9. **soal**
   - _id, ujian_id, nomor, pertanyaan, gambar, tipeJawaban (pg/essay), opsi (untuk PG), jawabanBenar, poin

10. **jawaban_ujian**
    - _id, ujian_id, siswa_id, responses[{soalId, jawaban, isBenar}], nilaiAkhir, waktuMulai, waktuSelesai, status

11. **raport**
    - _id, siswa_id, semester, tahun, mapel_id, nilaiBab[], nilaiBehavior, nilaiFinal

12. **presensi**
    - _id, siswa_id, tanggal, status (hadir/sakit/izin/alfa), keterangan

13. **token_ujian**
    - _id, token, dibuat_at, berlakuHingga (60 detik), status, diakses_oleh[]

14. **kartu_pelajar**
    - _id, siswa_id, qrCode (berisi URL), urlProfile, noSeriKartu, tahunBerlaku

---

## FITUR UTAMA & API ENDPOINTS

### A. AUTENTIKASI
- POST /api/auth/login - Login dengan NIS/NIP + Password
- POST /api/auth/logout - Logout user
- GET /api/auth/me - Get current user data

### B. ADMIN - MANAJEMEN DATA

**Kelas:**
- GET /api/admin/kelas - List semua kelas
- POST /api/admin/kelas - Tambah kelas
- PUT /api/admin/kelas/:id - Edit kelas
- DELETE /api/admin/kelas/:id - Hapus kelas
- POST /api/admin/kelas/naik-kelas - Proses naik kelas (bulk update)

**Siswa:**
- GET /api/admin/siswa - List siswa (dengan filter & pagination)
- POST /api/admin/siswa - Tambah siswa
- PUT /api/admin/siswa/:id - Edit siswa
- DELETE /api/admin/siswa/:id - Hapus siswa
- POST /api/admin/siswa/import - Import CSV siswa
- GET /api/admin/siswa/:id/mapel - List mapel siswa

**Guru:**
- GET /api/admin/guru - List guru
- POST /api/admin/guru - Tambah guru
- PUT /api/admin/guru/:id - Edit guru
- DELETE /api/admin/guru/:id - Hapus guru

**Mapel:**
- GET /api/admin/mapel - List mapel
- POST /api/admin/mapel - Tambah mapel
- PUT /api/admin/mapel/:id - Edit mapel
- DELETE /api/admin/mapel/:id - Hapus mapel

**Presensi:**
- GET /api/admin/presensi - List presensi (filter by tanggal, kelas, status)
- POST /api/admin/presensi - Input presensi (scan QR atau manual)
- GET /api/admin/presensi/analisis/:kelasId - Analisis kehadiran per kelas
- POST /api/admin/presensi/export-excel - Export presensi ke Excel

**Kartu Pelajar:**
- POST /api/admin/kartu-pelajar/generate - Generate kartu untuk kelas/siswa
- GET /api/admin/kartu-pelajar/preview/:siswaId - Preview kartu
- POST /api/admin/kartu-pelajar/export-zip - Export semua kartu sebagai ZIP

**Ujian & Token:**
- GET /api/admin/ujian/status - Get status ujian aktif/nonaktif
- PUT /api/admin/ujian/status - Update status ujian (aktif/nonaktif)
- GET /api/admin/ujian/token - Get token ujian terbaru (auto-refresh setiap 60 detik)
- GET /api/admin/ujian/log-akses - Log akses ujian siswa

**Dashboard Admin:**
- GET /api/admin/dashboard/stats - Statistik (total siswa, guru, kelas, ujian aktif)
- GET /api/admin/dashboard/activity - Activity log terbaru

### C. GURU - MANAJEMEN TUGAS & UJIAN

**Tugas:**
- GET /api/guru/tugas - List tugas (filter by tipe: tugas/ulangan/kuis)
- POST /api/guru/tugas - Buat tugas
- PUT /api/guru/tugas/:id - Edit tugas
- DELETE /api/guru/tugas/:id - Hapus tugas
- GET /api/guru/tugas/:id/submissions - List submission tugas
- PUT /api/guru/tugas/:id/submissions/:submissionId/nilai - Beri nilai
- GET /api/guru/tugas/:id/analisis - Analisis submission (sudah/belum submit)

**Ujian:**
- GET /api/guru/ujian - List ujian (filter by jenis: pg/essay, status)
- POST /api/guru/ujian - Buat ujian
- PUT /api/guru/ujian/:id - Edit ujian
- DELETE /api/guru/ujian/:id - Hapus ujian
- POST /api/guru/ujian/:id/soal - Tambah soal ke ujian
- PUT /api/guru/ujian/:id/soal/:soalId - Edit soal
- DELETE /api/guru/ujian/:id/soal/:soalId - Hapus soal
- GET /api/guru/ujian/:id/hasil - Lihat hasil ujian & analisis
- GET /api/guru/ujian/:id/hasil/:siswaId - Lihat jawaban siswa detail
- PUT /api/guru/ujian/:id/hasil/:siswaId/nilai - Beri nilai (essay)

**Raport:**
- GET /api/guru/raport - List raport per mapel/kelas
- PUT /api/guru/raport/:id - Input/update nilai raport siswa
- GET /api/guru/raport/:siswaId - Lihat raport detail siswa

**Dashboard Guru:**
- GET /api/guru/dashboard/stats - Statistik guru
- GET /api/guru/dashboard/aktivitas - Tugas & ujian terbaru

### D. SISWA - MENERIMA & MENGERJAKAN

**Tugas:**
- GET /api/siswa/tugas - List tugas yang diterima
- GET /api/siswa/tugas/:id - Detail tugas
- POST /api/siswa/tugas/:id/submit - Submit tugas + file
- GET /api/siswa/tugas/:id/nilai - Lihat nilai tugas

**Ujian:**
- GET /api/siswa/ujian - List ujian yang tersedia
- GET /api/siswa/ujian/:id - Detail ujian
- POST /api/siswa/ujian/validasi-token - Validasi token sebelum mulai ujian
- POST /api/siswa/ujian/:id/mulai - Mulai ujian (start timer)
- POST /api/siswa/ujian/:id/jawab - Submit jawaban soal (per soal atau bulk)
- POST /api/siswa/ujian/:id/selesai - Selesai ujian
- GET /api/siswa/ujian/:id/hasil - Lihat hasil ujian & jawaban

**Raport:**
- GET /api/siswa/raport - List raport siswa
- GET /api/siswa/raport/:id - Detail raport

**Dashboard Siswa:**
- GET /api/siswa/dashboard/stats - Statistik tugas & ujian
- GET /api/siswa/dashboard/jadwal - Jadwal tugas & ujian mendatang

**Profil Public:**
- GET /api/profile/:nis - Akses profil siswa (dari QR code)
  - Berisi: data siswa, analisis kehadiran, raport
  - Akses hanya dengan validasi NIS

---

## FRONTEND PAGES & COMPONENTS

### LOGIN PAGE
```
- Form login (NIS/NIP + Password)
- Toggle show password
- Button login (dummy - tidak proses)
- Responsive design
- Color: Biru gradient background
```

### DASHBOARD ADMIN
```
- Sidebar menu (collapsible)
- Top navbar
- Grid stats: Total Siswa, Guru, Kelas, Ujian Aktif
- Chart statistik siswa per kelas
- Activity log tabel
- Quick action buttons
```

### ADMIN - INPUT DATA
```
Kelas:
- Form: Tingkatan (7-12), Nama, Kapasitas, Status
- Tabel: List kelas dengan aksi edit/hapus
- Button naik kelas: Preview + Konfirmasi

Siswa:
- Form: NIS, Nama, Email, Kelas, Mapel (multi-select + opsi "Semua Mapel")
- Tabel: List siswa dengan filter & search
- Import CSV button

Guru:
- Form: NIP, Nama, Email, Kelas (multi-select), Mapel (multi-select)
- Tabel: List guru dengan filter & search

Mapel:
- Form: Kode, Nama, SKS, Jenis (Wajib/Peminatan)
- Tabel: List mapel dengan filter
```

### ADMIN - UJIAN & TOKEN
```
- Toggle aktifkan/nonaktifkan ujian
- Display token ujian (large text) + timer 60 detik (live update)
- Copy token button
- Riwayat token tabel
- Log akses ujian (siswa login dengan token)
```

### ADMIN - KARTU PELAJAR & PRESENSI
```
Kartu Pelajar:
- Filter kelas + tahun ajaran
- Preview kartu A6 size (front & back)
- QR code display (dummy pattern)
- Daftar siswa yang akan di-generate
- Export ZIP button

Presensi:
- Filter: Kelas, Tanggal, Status
- Statistik: Hadir, Sakit, Izin, Alfa
- Tabel presensi detail dengan search & sort
- Export Excel button
```

### DASHBOARD GURU
```
- Stats: Mapel, Kelas, Tugas Aktif, Ujian Aktif
- Tabel: Tugas & ujian terbaru
- Tabel: Status pengumpulan siswa
```

### GURU - KELOLA TUGAS
```
- Form: Judul, Kelas (multi), Mapel, Deskripsi, Deadline, Attachment
- Tabel: List tugas dengan aksi edit/hapus/lihat hasil/beri nilai
- Modal: Submit siswa dengan tabel & aksi download/nilai
- Status badge: Draft, Dipublikasikan
```

### GURU - KELOLA UJIAN
```
- Tab: Ujian PG | Ujian Essay
- Form: Judul, Kelas, Mapel, Durasi, Passing Grade, Soal, Instruksi
- Tabel: List ujian dengan aksi edit/hapus/edit soal/lihat hasil

Edit Soal Modal:
- List soal dengan nomor, pertanyaan (preview), poin
- Form edit: Pertanyaan, Opsi (PG), Jawaban Benar, Penjelasan
- Drag to reorder soal
- Hapus soal button

Hasil Ujian:
- Statistik: Total peserta, Sudah selesai, Rata-rata, Min, Max, Passing rate
- Bar chart: Distribusi nilai
- Tabel: Siswa + Nilai + Status penilaian
- Modal: Lihat jawaban siswa detail (soal per soal)
```

### DASHBOARD SISWA
```
- Stats: Tugas aktif, Ulangan aktif, Ujian aktif
- Tabel: Tugas & ujian yang diterima
- Status badge: Belum mulai, Sedang dikerjakan, Sudah submit, Sudah dinilai
```

### SISWA - LIHAT TUGAS
```
- List tugas yang diterima
- Filter by status & kelas
- Card per tugas: Judul, Guru, Deadline, Instruksi, Attachment
- Button submit tugas
- Modal submit: File upload + submit button
- Notification: Submit berhasil/gagal
```

### SISWA - LIHAT UJIAN
```
- List ujian yang tersedia
- Status: Belum dibuka, Belum mulai, Sedang ujian, Selesai
- Card per ujian: Judul, Guru, Tanggal, Durasi, Status

Mulai Ujian:
- Modal validasi token: Input token + Submit
- Jika benar: Redirect ke halaman ujian
- Jika salah: Error message + retry

Halaman Ujian (PG):
- Header: Timer countdown, Nomor soal saat ini
- Soal display: Pertanyaan + Gambar (jika ada)
- Radio button opsi: A, B, C, D, E
- Navigation: Tombol Previous/Next soal
- Sidebar: List nomor soal dengan indicator (belum jawab/sudah jawab/ragu-ragu)
- Button Selesai Ujian (konfirmasi) + Ragu-ragu soal

Halaman Ujian (Essay):
- Header: Timer countdown
- Soal display: Pertanyaan + Gambar
- Textarea: Untuk jawaban essay
- Navigation: Previous/Next soal
- Sidebar: List nomor soal
- Button Selesai Ujian

Hasil Ujian:
- Nilai final + score per soal
- Untuk PG: Lihat jawaban benar/salah dengan penjelasan
- Untuk Essay: Jawaban + Nilai + Komentar guru
```

### SISWA - LIHAT RAPORT
```
- Filter: Semester, Mapel
- Card/Tabel: Mapel, Nilai, Grade (A-F), Predikat
- Summary: Rata-rata nilai, IPK
```

### PROFIL PUBLIC (dari QR code)
```
URL: /profile/:nis
- Header: Foto siswa, Nama, NIS, Kelas
- Tab: Profil | Kehadiran | Raport

Profil Tab:
- Data siswa (Nama, NIS, Kelas, Mapel, Email)

Kehadiran Tab:
- Chart kehadiran per bulan
- Statistik: Hadir, Sakit, Izin, Alfa (total & persentase)
- Tabel detail kehadiran

Raport Tab:
- Select semester & tahun ajaran
- Tabel raport: Mapel, Nilai, Grade
```

---

## TECHNICAL FEATURES

### FRONTEND:
- React Hooks (useState, useEffect, useContext untuk auth)
- Tailwind CSS utility classes only
- Lucide React icons
- Form handling & validation
- Pagination & filtering
- Real-time timer (60 detik token, ujian timer)
- File upload preview
- Responsive layout (mobile-first)
- Toast notifications

### BACKEND:
- REST API with Express.js
- MongoDB/Mongoose ORM
- JWT authentication
- Password hashing (bcrypt)
- File upload handling (multer)
- CSV import processing
- QR code generation (qrcode library)
- ZIP file creation
- Email notifications (optional)
- Token auto-refresh logic (setiap 60 detik)
- Input validation & error handling
- Pagination & filtering helper
- Middleware for role-based access control

### SECURITY:
- JWT token authentication
- Password hashing
- CORS protection
- Input sanitization
- Role-based access control (Admin, Guru, Siswa)
- Token ujian validation sebelum akses
- Rate limiting (optional)

---

## INSTRUKSI DEVELOPMENT

1. **Setup Backend:**
   - Create Express server dengan MongoDB connection
   - Setup authentication (JWT)
   - Create API endpoints sesuai spec di atas
   - Setup middleware untuk role-based access

2. **Setup Frontend:**
   - Create React app struktur folder: pages, components, hooks, context, utils
   - Create layout wrapper (Navbar + Sidebar)
   - Create context untuk auth state
   - Create components untuk form, table, modal, notification

3. **Integration:**
   - Connect frontend API calls ke backend endpoints
   - Handle loading & error states
   - Setup interceptor untuk JWT token management

4. **Testing:**
   - Manual test setiap endpoint
   - Test form validation
   - Test permission/role-based access
   - Test responsive design

---

## CATATAN PENTING

- Token ujian auto-generate setiap 60 detik di backend, frontend polling setiap detik untuk update display
- QR code berisi URL: `www.sekolahanda.com/profile/{NIS}`
- Fitur naik kelas adalah bulk update (tingkatan level up, nama kelas tetap sama)
- Multi-select mapel di siswa ada opsi "Semua Mapel" untuk shortcut
- Ujian hanya bisa diakses jika status ujian AKTIF + token valid
- Essay ujian penilaian bisa otomatis (keyword matching) atau manual (guru)
- Kartu pelajar export sebagai ZIP berisi PDF per siswa
- Presensi bisa input manual atau scan QR code
- Login page siap UI tapi tidak aktif (dummy)