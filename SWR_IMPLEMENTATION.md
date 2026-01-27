# SWR Implementation Documentation

## ✅ Implementasi Lengkap - SELESAI

### 1. Package Installation
```bash
npm install swr
```
**Status:** ✅ Installed (v2.x)

---

### 2. SWR Configuration
**File:** `src/lib/swr-config.ts`

**Features:**
- ✅ Revalidate on focus (5 menit throttle)
- ✅ Revalidate on reconnect
- ✅ Dedupe requests (2 detik)
- ✅ Auto retry on error (3x, interval 5 detik)
- ✅ Fetcher dengan dan tanpa authentication

---

### 3. Custom Hooks
**File:** `src/hooks/useSWR.ts`

**Generic Hooks:**
- `useData<T>(key, useAuth)` - GET requests
- `useMutateData<T>(key)` - POST/PUT/DELETE

**Resource-Specific Hooks:**
- `usePresensi(date?)` - Data presensi
- `useSiswa(kelas?)` - Data siswa
- `useKelas()` - Data kelas
- `useMapel()` - Data mata pelajaran
- `useKartuPelajar(kelas?)` - Data kartu pelajar
- `useNilai(kelas?, mapel?)` - Data nilai
- `useMateri(kelas?, mapel?)` - Data materi
- `useUjian(kelas?, status?)` - Data ujian
- `useTugas(kelas?, status?)` - Data tugas
- `useTugasDetail(id)` - Detail tugas dengan submissions

---

### 4. UI Components
**File:** `src/components/ui/loading-spinner.tsx`

**Components:**
- `<LoadingSpinner size="sm|md|lg" />` - Animated spinner
- `<LoadingState message="..." />` - Full loading state
- `<ErrorState message="..." onRetry={fn} />` - Error state dengan retry

---

### 5. SWR Provider
**File:** `src/app/providers.tsx`

Wraps aplikasi dengan SWRConfig global.

**File:** `src/app/layout.tsx`

Root layout sudah di-wrap dengan `<Providers>`.

---

### 6. API Endpoints (Mock)
Semua endpoint sudah dibuat dengan struktur konsisten:

#### Admin Endpoints:
- ✅ `/api/siswa` - GET & POST
- ✅ `/api/presensi` - GET & POST
- ✅ `/api/kelas` - GET & POST
- ✅ `/api/mapel` - GET & POST
- ✅ `/api/kartu-pelajar` - GET

#### Guru Endpoints:
- ✅ `/api/nilai` - GET & POST
- ✅ `/api/materi` - GET & POST
- ✅ `/api/ujian` - GET & POST
- ✅ `/api/tugas` - GET & POST

**Features:**
- Simulate network delay (500ms)
- Support query parameters
- Consistent response format: `{ success: true, data: [...], message?: "..." }`

---

## 📖 Cara Penggunaan

### Example 1: Basic Usage
```tsx
"use client";

import { useSiswa } from '@/hooks/useSWR';
import { LoadingState, ErrorState } from '@/components/ui/loading-spinner';

export default function SiswaPage() {
  const { data, isLoading, isError, mutate } = useSiswa();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => mutate()} />;

  const siswa = data?.data || [];

  return (
    <div>
      {siswa.map(s => <div key={s.id}>{s.nama}</div>)}
    </div>
  );
}
```

### Example 2: With Filters
```tsx
const [filterKelas, setFilterKelas] = useState('all');

const { data, isLoading, isError } = useSiswa(
  filterKelas === 'all' ? undefined : filterKelas
);

// SWR akan auto re-fetch saat filterKelas berubah
// Dan akan cache hasil untuk setiap kombinasi filter
```

### Example 3: Mutation
```tsx
import { useMutateData } from '@/hooks/useSWR';

const { trigger, isMutating } = useMutateData('/api/siswa');

const handleSubmit = async (formData) => {
  try {
    await trigger({
      method: 'POST',
      body: formData
    });
    toast.success('Data berhasil disimpan');
    mutate(); // Revalidate data
  } catch (error) {
    toast.error('Gagal menyimpan data');
  }
};
```

---

## 🚀 Keuntungan SWR

### 1. Automatic Caching ✅
- Data di-cache di memory
- Request yang sama tidak hit server lagi
- Sharing data antar components

### 2. Request Deduplication ✅
- Multiple components request data sama
- Hanya 1 request ke server
- Semua components dapat data yang sama

### 3. Automatic Revalidation ✅
- Auto refresh saat focus
- Auto refresh saat reconnect
- Background revalidation

### 4. Optimistic Updates ✅
- Update UI immediately
- Revalidate di background
- Rollback jika gagal

### 5. Error Handling ✅
- Auto retry (3x)
- Error state management
- User-friendly error UI

### 6. Performance ✅
- Mengurangi beban server drastis
- Faster UI dengan cached data
- Better UX dengan loading states

---

## 🔄 Data Flow

```
User Action
    ↓
SWR Hook (useData)
    ↓
Check Cache
    ↓
├─ Cache Hit → Return cached data + Revalidate in background
└─ Cache Miss → Fetch from API → Cache → Return data
    ↓
Component Renders
    ↓
Auto Revalidate on:
- Focus (user returns to tab)
- Reconnect (network back)
- Manual trigger (mutate())
```

---

## 📊 Cache Strategy

### Global Cache (Shared)
- Semua hooks dengan key yang sama share cache
- Guru dan Siswa akses data yang sama = 1 request
- Cache persists selama app lifetime

### Per-Resource Cache
- `/api/siswa` → Cached
- `/api/siswa?kelas=7A` → Cached separately
- `/api/siswa?kelas=7B` → Cached separately

### Revalidation
- Focus: 5 menit throttle
- Reconnect: Immediate
- Manual: Via `mutate()`

---

## 🎯 Next Steps: Database Integration

Saat migrasi ke database real:

1. **Replace Mock Data:**
   ```ts
   // Before (Mock)
   const mockSiswa = [...];
   return NextResponse.json({ data: mockSiswa });
   
   // After (Database)
   const siswa = await prisma.siswa.findMany();
   return NextResponse.json({ data: siswa });
   ```

2. **Hooks tetap sama:**
   ```ts
   // Tidak perlu ubah apapun di component
   const { data } = useSiswa();
   ```

3. **SWR Config tetap sama:**
   - Caching strategy sama
   - Revalidation sama
   - Error handling sama

---

## ✅ Status Implementasi

### Infrastructure
- [x] SWR Package installed
- [x] Global configuration
- [x] Custom hooks
- [x] Loading/Error components
- [x] Provider setup
- [x] Root layout wrapped

### API Endpoints
- [x] Siswa
- [x] Presensi
- [x] Kelas
- [x] Mapel
- [x] Kartu Pelajar
- [x] Nilai
- [x] Materi
- [x] Ujian
- [x] Tugas

### Ready for Database
- [x] API structure ready
- [x] Response format consistent
- [x] Error handling ready
- [x] Authentication ready
- [ ] Prisma schema (Next step)
- [ ] Database connection (Next step)
- [ ] Real queries (Next step)

---

## 🎉 Kesimpulan

**SWR Implementation: 100% Complete**

Semua infrastruktur SWR sudah siap. Aplikasi sekarang:
- ✅ Menggunakan caching otomatis
- ✅ Mengurangi beban server
- ✅ Sharing data antar users
- ✅ Auto revalidation
- ✅ Error handling
- ✅ Loading states

**Siap untuk migrasi ke database real dengan Prisma!**
