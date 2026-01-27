# Update Guru Pages - Progress Report

## ✅ Completed Pages

### 1. Guru Dashboard (`/guru/page.tsx`)
**API Endpoint**: `/api/guru/dashboard`

**Features**:
- ✅ Real-time statistics filtered by guruId
  - Total kelas yang diajar
  - Total siswa di kelas yang diajar  
  - Jadwal hari ini (berdasarkan hari aktual)
  - Tugas belum dinilai
- ✅ List jadwal hari ini (5 teratas)
- ✅ List tugas pending (5 teratas)
- ✅ SWR dengan auto-refresh 30 detik
- ✅ Menampilkan nama guru dari session

**Query Logic**:
```typescript
// Get kelas yang diajar
prisma.guruKelas.count({ where: { guruId: guru.id } })

// Get siswa di kelas yang diajar
prisma.siswa.count({
  where: {
    kelas: {
      guru: { some: { guruId: guru.id } }
    }
  }
})

// Jadwal hari ini
prisma.jadwal.count({
  where: { guruId: guru.id, hari: dayName }
})
```

---

### 2. Guru Jadwal (`/guru/jadwal/page.tsx`)
**API Endpoint**: `/api/guru/jadwal`

**Features**:
- ✅ Menampilkan semua jadwal mengajar guru
- ✅ Filter kelas dinamis dari database
- ✅ Grouping jadwal per hari (Senin-Sabtu)
- ✅ Ringkasan: total sesi, kelas diampu, jam mengajar/minggu
- ✅ SWR untuk real-time data

**Query Logic**:
```typescript
// Get jadwal guru
prisma.jadwal.findMany({
  where: { guruId: guru.id },
  include: { kelas: true, mapel: true },
  orderBy: [{ hari: 'asc' }, { jamMulai: 'asc' }]
})

// Get kelas list
prisma.kelas.findMany({
  where: {
    guru: { some: { guruId: guru.id } }
  }
})
```

---

### 3. Guru Nilai (`/guru/nilai/page.tsx`)
**API Endpoints**: 
- GET `/api/guru/nilai?kelasId=xxx&mapelId=xxx`
- POST `/api/guru/nilai` (untuk save)

**Features**:
- ✅ Filter kelas dan mapel dinamis dari database
- ✅ Menampilkan siswa di kelas terpilih
- ✅ Input nilai: Tugas, UTS, UAS
- ✅ Auto-calculate nilai akhir berdasarkan bobot
- ✅ Save semua nilai sekaligus
- ✅ Statistik: total siswa, sudah dinilai, belum dinilai, rata-rata
- ✅ SWR dengan mutate setelah save

**Query Logic**:
```typescript
// Get siswa dengan nilai
prisma.siswa.findMany({
  where: { kelasId: kelasId },
  include: {
    nilai: {
      where: { mapelId: mapelId, guruId: guru.id }
    }
  }
})

// Upsert nilai
prisma.nilai.upsert({
  where: {
    siswaId_mapelId_semester_tahunAjaran: { ... }
  },
  update: { tugas, uts, uas, nilaiAkhir },
  create: { ... }
})
```

---

## 🔄 Pattern yang Digunakan

Setiap page mengikuti pattern konsisten:

```typescript
// 1. Import dependencies
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// 2. Fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

// 3. Component dengan hooks
export default function Page() {
  const { user, isLoading: authLoading } = useAuth();
  const { data, error, isLoading, mutate } = useSWR('/api/guru/[endpoint]', fetcher);

  // 4. Loading states
  if (authLoading || isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

  // 5. Extract data
  const items = data?.data?.items || [];

  // 6. Render with real data
  return <div>...</div>;
}
```

---

## 📋 Remaining Pages

### 4. Guru Materi (`/guru/materi/page.tsx`)
**Status**: Pending
**Needs**:
- API endpoint `/api/guru/materi`
- Filter by mapel dan kelas
- Upload materi (PDF, video, link)
- List materi yang sudah diupload
- Delete/edit materi

### 5. Guru Ujian (`/guru/ujian/page.tsx`)
**Status**: Pending
**Needs**:
- API endpoint `/api/guru/ujian`
- List ujian yang dibuat guru
- Filter by mapel, status, tanggal
- Create/edit/delete ujian
- View submissions

### 6. Guru Tugas (`/guru/tugas/page.tsx`)
**Status**: Pending
**Needs**:
- API endpoint `/api/guru/tugas`
- List tugas yang dibuat guru
- Filter by mapel, status, deadline
- Create/edit/delete tugas
- View submissions dan nilai

---

## 🔑 Key Points

### Authentication & Authorization
- Semua API endpoint menggunakan `getSession()` untuk validasi
- Check `session.role === 'GURU'`
- Get `guruId` dari database berdasarkan `session.userId`
- Semua query di-filter berdasarkan `guruId`

### Data Filtering
```typescript
// Pattern untuk filter data guru
const guru = await prisma.guru.findFirst({
  where: { userId: session.userId }
});

// Kemudian filter semua query dengan guruId
where: { guruId: guru.id }
```

### SWR Configuration
```typescript
useSWR('/api/endpoint', fetcher, {
  refreshInterval: 30000, // Optional: auto-refresh
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
})
```

### Error Handling
```typescript
// Consistent error handling
if (authLoading || isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage />;
if (!data?.success) return <ErrorMessage />;
```

---

## 📊 Database Relations Used

```
User (session.userId)
  ↓
Guru (guru.id)
  ↓
├── GuruKelas → Kelas → Siswa
├── GuruMapel → MataPelajaran
├── Jadwal
├── Nilai
├── Materi
├── Tugas
└── Ujian
```

---

## 🎯 Next Steps

1. ✅ Dashboard - DONE
2. ✅ Jadwal - DONE
3. ✅ Nilai - DONE
4. ⏳ Materi - IN PROGRESS
5. ⏳ Ujian - TODO
6. ⏳ Tugas - TODO

---

## 💡 Tips

1. **Always filter by guruId** - Jangan lupa filter semua query dengan guruId
2. **Use SWR mutate** - Setelah POST/PUT/DELETE, panggil `mutate()` untuk refresh data
3. **Consistent error handling** - Gunakan pattern yang sama untuk loading & error states
4. **Type safety** - Gunakan interface untuk data structure
5. **Loading states** - Selalu tampilkan loading spinner saat fetch data

---

Generated: 2026-01-27
