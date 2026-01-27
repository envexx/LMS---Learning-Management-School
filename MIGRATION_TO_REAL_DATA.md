# Migrasi dari Mock Data ke Real Database

## ✅ Status: SELESAI

Semua API endpoints telah berhasil dimigrasi dari mock data ke real database menggunakan Prisma ORM dan terintegrasi dengan SWR untuk caching di frontend.

---

## 📋 API Routes yang Telah Dimigrasi

### 1. **Siswa API** - `/api/siswa`
**File:** `src/app/api/siswa/route.ts`

**GET:**
- Mengambil data siswa dari database dengan relasi (user, kelas, kartu pelajar)
- Filter berdasarkan `kelasId`
- Sorting berdasarkan nama (ascending)

**POST:**
- Membuat siswa baru di database
- Auto-generate ID menggunakan Prisma

**SWR Hook:** `useSiswa(kelasId?)`

---

### 2. **Kelas API** - `/api/kelas`
**File:** `src/app/api/kelas/route.ts`

**GET:**
- Mengambil semua kelas dengan count siswa
- Sorting berdasarkan tingkat dan nama

**POST:**
- Membuat kelas baru

**SWR Hook:** `useKelas()`

---

### 3. **Presensi API** - `/api/presensi`
**File:** `src/app/api/presensi/route.ts`

**GET:**
- Mengambil presensi berdasarkan tanggal dan kelas
- Include relasi siswa dan kelas
- Default: hari ini jika tanggal tidak disediakan

**POST:**
- Upsert presensi (update jika ada, create jika tidak)
- Unique constraint: `siswaId_tanggal`

**SWR Hook:** `usePresensi(tanggal?)`

---

### 4. **Mata Pelajaran API** - `/api/mapel`
**File:** `src/app/api/mapel/route.ts`

**GET:**
- Mengambil semua mata pelajaran dengan count guru
- Sorting berdasarkan nama

**POST:**
- Membuat mata pelajaran baru

**SWR Hook:** `useMapel()`

---

### 5. **Kartu Pelajar API** - `/api/kartu-pelajar`
**File:** `src/app/api/kartu-pelajar/route.ts`

**GET:**
- Mengambil kartu pelajar dengan relasi siswa dan kelas
- Filter berdasarkan `kelasId`
- Sorting berdasarkan nama siswa

**SWR Hook:** `useKartuPelajar(kelasId?)`

---

### 6. **Nilai API** - `/api/nilai`
**File:** `src/app/api/nilai/route.ts`

**GET:**
- Mengambil nilai dengan relasi siswa, kelas, mapel, dan guru
- Filter: `kelasId`, `mapelId`, `semester`, `tahunAjaran`
- Sorting berdasarkan nama siswa

**POST:**
- Upsert nilai (update jika ada, create jika tidak)
- Unique constraint: `siswaId_mapelId_semester_tahunAjaran`
- Auto-calculate `nilaiAkhir`

**SWR Hook:** `useNilai(kelasId?, mapelId?)`

---

### 7. **Tugas API** - `/api/tugas`
**File:** `src/app/api/tugas/route.ts`

**GET:**
- Mengambil tugas dengan stats (guru, mapel, submissions)
- Filter: `kelasId`, `guruId`, `mapelId`
- Array filter untuk kelas (supports multiple classes)
- Sorting berdasarkan deadline

**POST:**
- Membuat tugas baru
- Default status: 'aktif'

**SWR Hook:** `useTugas(kelasId?, guruId?)`

---

### 8. **Ujian API** - `/api/ujian`
**File:** `src/app/api/ujian/route.ts`

**GET:**
- Mengambil ujian dengan stats (soal, submissions)
- Filter: `kelasId`, `guruId`, `mapelId`, `status`
- Array filter untuk kelas
- Sorting berdasarkan tanggal (descending)

**POST:**
- Membuat ujian baru
- Default status: 'DRAFT'

**SWR Hook:** `useUjian(kelasId?, status?)`

---

### 9. **Materi API** - `/api/materi`
**File:** `src/app/api/materi/route.ts`

**GET:**
- Mengambil materi dengan relasi mapel dan guru
- Filter: `kelasId`, `mapelId`, `guruId`
- Array filter untuk kelas
- Sorting berdasarkan createdAt (descending)

**POST:**
- Upload materi baru

**SWR Hook:** `useMateri(kelasId?, mapelId?)`

---

## 🔄 Integrasi SWR

Semua API endpoints sudah terintegrasi dengan SWR hooks yang telah dibuat sebelumnya:

### Global SWR Config
**File:** `src/lib/swr-config.ts`
- Revalidate on focus
- Dedupe requests
- Error retry dengan exponential backoff
- Custom fetcher dengan error handling

### Custom Hooks
**File:** `src/hooks/useSWR.ts`
- Generic hooks: `useSWRData`, `useSWRMutation`
- Specific hooks untuk setiap entity
- Auto-caching dan revalidation
- Optimistic updates

---

## 🗃️ Database Schema

### Models yang Digunakan:
1. **User** - Authentication & authorization
2. **Siswa** - Student data dengan relasi ke User dan Kelas
3. **Guru** - Teacher data dengan relasi ke User dan MataPelajaran
4. **Kelas** - Class/grade information
5. **MataPelajaran** - Subject/course data
6. **Presensi** - Attendance records
7. **KartuPelajar** - Student ID cards
8. **Nilai** - Grades/scores
9. **Tugas** - Assignments
10. **Ujian** - Exams dengan soal
11. **Materi** - Learning materials

### Relasi Penting:
- Siswa → User (one-to-one)
- Siswa → Kelas (many-to-one)
- Siswa → KartuPelajar (one-to-one)
- Guru → User (one-to-one)
- Guru ↔ MataPelajaran (many-to-many via GuruMapel)
- Nilai → Siswa, MataPelajaran, Guru (many-to-one)
- Tugas → Guru, MataPelajaran (many-to-one)
- Ujian → Guru, MataPelajaran (many-to-one)

---

## 🚀 Performance Optimizations

### 1. **Eager Loading**
Menggunakan `include` untuk load relasi sekaligus (prevent N+1):
```typescript
include: {
  siswa: {
    include: {
      kelas: true,
      user: true,
    },
  },
}
```

### 2. **Query Helpers**
**File:** `src/lib/query-helpers.ts`
- `includes.siswaWithRelations`
- `includes.guruWithRelations`
- `includes.tugasWithStats`
- `includes.ujianWithStats`
- `includes.nilaiWithRelations`

### 3. **Database Indexes**
35+ indexes pada kolom yang sering di-query:
- `siswa`: nisn, nis, kelasId, email
- `nilai`: siswaId, mapelId, semester
- `tugas`: guruId, mapelId, deadline
- dll.

### 4. **Connection Pooling**
**File:** `src/lib/prisma.ts`
- Max 100 connections
- Pool timeout: 20 seconds
- Graceful shutdown

---

## 📊 Data Seeding

Database sudah di-populate dengan data test:
- 1 Admin
- 3 Guru (Matematika, B.Indonesia, IPA)
- 7 Siswa (Kelas 7A, 7B, 8A)
- 4 Mata Pelajaran
- 3 Kelas
- 7 Kartu Pelajar
- 7 Presensi (hari ini)
- 1 Tugas
- 1 Ujian (dengan 3 soal)
- 5 Nilai records

**Seed Command:**
```bash
npx prisma db seed
```

---

## 🧪 Testing

### Test API Endpoints:

**1. Test Siswa API:**
```bash
curl http://localhost:3000/api/siswa
curl http://localhost:3000/api/siswa?kelas=7A
```

**2. Test Presensi API:**
```bash
curl http://localhost:3000/api/presensi
curl http://localhost:3000/api/presensi?tanggal=2024-01-27
```

**3. Test Nilai API:**
```bash
curl http://localhost:3000/api/nilai
curl http://localhost:3000/api/nilai?kelas=7A&mapel=matematika
```

### Test dengan SWR di Frontend:

**1. Import hook:**
```typescript
import { useSiswa } from '@/hooks/useSWR';
```

**2. Gunakan di component:**
```typescript
const { data, error, isLoading } = useSiswa('7A');
```

**3. Handle states:**
```typescript
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorState error={error} />;
return <DataTable data={data} />;
```

---

## ✅ Checklist Migrasi

- [x] Update semua API routes untuk menggunakan Prisma
- [x] Remove semua mock data
- [x] Add error handling di setiap endpoint
- [x] Integrate dengan SWR hooks
- [x] Add database indexes untuk performance
- [x] Setup connection pooling
- [x] Create seed data
- [x] Test API endpoints
- [x] Regenerate Prisma Client
- [ ] Test frontend integration
- [ ] Monitor performance
- [ ] Deploy to production

---

## 🔧 Troubleshooting

### Error: "Property 'xxx' does not exist on PrismaClient"
**Solution:** Run `npx prisma generate` untuk regenerate Prisma Client

### Error: "Connection pool timeout"
**Solution:** Check DATABASE_URL dan pastikan connection limit sesuai

### Error: "Unique constraint failed"
**Solution:** Check data yang di-insert, pastikan unique fields tidak duplicate

### SWR tidak auto-revalidate
**Solution:** Check SWR config di `src/lib/swr-config.ts`

---

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [SWR Documentation](https://swr.vercel.app)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## 🎯 Next Steps

1. **Test semua pages** dengan real data
2. **Monitor performance** menggunakan Prisma Studio
3. **Add pagination** untuk list yang besar
4. **Implement Redis caching** (optional)
5. **Add data validation** dengan Zod
6. **Setup error monitoring** (Sentry)
7. **Deploy to production**

---

**Status:** ✅ Migration Complete - Ready for Testing!
**Date:** January 27, 2026
**Version:** 1.0.0
