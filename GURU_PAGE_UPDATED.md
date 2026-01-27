# ✅ Halaman Guru Berhasil Diupdate ke Data Real-Time

## Status: SELESAI

Halaman guru telah berhasil diupdate dari mock data ke data real-time dari database menggunakan Prisma dan SWR.

---

## 🔧 Yang Sudah Diperbaiki

### **1. API Endpoint Guru** ✅
**File:** `src/app/api/guru/route.ts`

**Methods:**
- ✅ `GET` - Fetch data guru dari database
- ✅ `POST` - Create guru baru
- ✅ `PUT` - Update data guru
- ✅ `DELETE` - Hapus guru

**Features:**
```typescript
// GET - dengan filter mata pelajaran
export async function GET(request: Request) {
  const guru = await prisma.guru.findMany({
    where: mapelId ? {
      mapel: { some: { mapelId } }
    } : undefined,
    include: includes.guruWithRelations,
    orderBy: { nama: 'asc' },
  });
  // ...
}

// PUT - Update guru
export async function PUT(request: Request) {
  const { id, ...data } = body;
  const updatedGuru = await prisma.guru.update({
    where: { id },
    data: { nip, nama, email, noTelp, alamat },
    include: includes.guruWithRelations,
  });
  // ...
}

// DELETE - Hapus guru
export async function DELETE(request: Request) {
  const id = searchParams.get('id');
  await prisma.guru.delete({ where: { id } });
  // ...
}
```

---

### **2. SWR Hook untuk Guru** ✅
**File:** `src/hooks/useSWR.ts`

**Hook Baru:**
```typescript
// Guru
export function useGuru(mapel?: string) {
  const key = mapel && mapel !== 'all' 
    ? `/api/guru?mapel=${mapel}` 
    : '/api/guru';
  return useData(key, true);
}
```

---

### **3. Halaman Guru dengan Data Real** ✅
**File:** `src/app/(main)/admin/guru/page.tsx`

**Perubahan:**

#### **SEBELUM (Mock Data):**
```typescript
❌ const [guru, setGuru] = useState<Guru[]>([]);

❌ useEffect(() => {
  setGuru([
    {
      id: "1",
      nip: "198501012010011001",
      nama: "Dr. Budi Hartono, M.Pd",
      // ... hardcoded data
    },
  ]);
}, []);
```

#### **SESUDAH (Real Data):**
```typescript
✅ const { data: guruData, error, isLoading, mutate } = useGuru(selectedMapel);
✅ const { data: mapelData, isLoading: mapelLoading } = useMapel();

✅ if (isLoading || mapelLoading) {
    return <LoadingSpinner />;
  }

✅ if (error) {
    return <ErrorState message="Gagal memuat data guru" onRetry={() => mutate()} />;
  }

✅ const guru = guruData?.data || [];
✅ const mapelList = mapelData?.data || [];
```

---

### **4. CRUD Operations dengan Real API** ✅

#### **CREATE:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  const method = editingGuru ? 'PUT' : 'POST';
  const payload = editingGuru ? { id: editingGuru.id, ...formData } : formData;
  
  const response = await fetch('/api/guru', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    toast.success(editingGuru ? "Data guru berhasil diperbarui" : "Guru berhasil ditambahkan");
    mutate(); // ✅ Refresh data dari database
    setIsDialogOpen(false);
    resetForm();
  }
};
```

#### **UPDATE:**
```typescript
// ✅ Menggunakan PUT method dengan ID
const method = editingGuru ? 'PUT' : 'POST';
const payload = editingGuru ? { id: editingGuru.id, ...formData } : formData;
```

#### **DELETE:**
```typescript
const handleDelete = async () => {
  if (!deleteModal.guru) return;
  
  const response = await fetch(`/api/guru?id=${deleteModal.guru.id}`, {
    method: 'DELETE', // ✅ DELETE method
  });

  if (response.ok) {
    toast.success("Guru berhasil dihapus");
    mutate(); // ✅ Refresh data
    setDeleteModal({ open: false, guru: null });
  }
};
```

---

### **5. Delete Confirmation Modal** ✅

**Implementasi:**
```typescript
const [deleteModal, setDeleteModal] = useState<{ open: boolean; guru: any | null }>({
  open: false,
  guru: null,
});

const openDeleteModal = (guru: any) => {
  setDeleteModal({ open: true, guru });
};

// Modal component
<DeleteConfirmationModal
  open={deleteModal.open}
  onOpenChange={(open) => setDeleteModal({ open, guru: null })}
  onConfirm={handleDelete}
  title="Hapus Guru"
  description="Apakah Anda yakin ingin menghapus guru"
  itemName={deleteModal.guru?.nama}
/>
```

---

## 📊 Fitur Halaman Guru

### **1. Tampilan Data Real:**
- ✅ NIP
- ✅ Nama lengkap
- ✅ Email
- ✅ No. Telepon
- ✅ Mata pelajaran yang diajar (dari relasi)
- ✅ Alamat

### **2. Search & Filter:**
- ✅ Search berdasarkan nama, NIP, atau email
- ✅ Filter berdasarkan mata pelajaran (optional)

### **3. CRUD Operations:**
- ✅ **Create** - Tambah guru baru
- ✅ **Read** - Tampilkan data dari database
- ✅ **Update** - Edit data guru (PUT method)
- ✅ **Delete** - Hapus guru dengan modal konfirmasi

### **4. UI/UX:**
- ✅ Loading spinner saat fetch data
- ✅ Error state dengan retry button
- ✅ Toast notifications untuk feedback
- ✅ Modal konfirmasi delete (bukan alert)
- ✅ Form validation
- ✅ Auto-refresh setelah CRUD

---

## 🗄️ Database Schema

### **Model Guru:**
```prisma
model Guru {
  id        String   @id @default(cuid())
  nip       String   @unique
  nama      String
  email     String   @unique
  noTelp    String?
  alamat    String?
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  mapel     GuruMapel[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model GuruMapel {
  id        String        @id @default(cuid())
  guruId    String
  mapelId   String
  guru      Guru          @relation(fields: [guruId], references: [id])
  mapel     MataPelajaran @relation(fields: [mapelId], references: [id])
  
  @@unique([guruId, mapelId])
}
```

---

## 🧪 Cara Test

### **1. Test READ:**
```
1. Buka http://localhost:3000/admin/guru
2. ✅ Data guru muncul dari database
3. ✅ Mata pelajaran ditampilkan dengan badge
4. ✅ Search berfungsi
```

### **2. Test CREATE:**
```
1. Klik "Tambah Guru"
2. Isi form (NIP, Nama, Email, dll)
3. Klik "Tambah"
4. ✅ Data tersimpan di database
5. ✅ Toast success muncul
6. ✅ Data muncul di tabel
```

### **3. Test UPDATE:**
```
1. Klik icon edit (pensil)
2. Form terbuka dengan data existing
3. Ubah data (misal: nama atau email)
4. Klik "Perbarui"
5. ✅ Data terupdate di database (bukan buat baru)
6. ✅ Toast "Data guru berhasil diperbarui"
7. ✅ Perubahan terlihat di tabel
```

### **4. Test DELETE:**
```
1. Klik icon delete (trash)
2. ✅ Modal konfirmasi muncul
3. ✅ Nama guru ditampilkan
4. Klik "Hapus"
5. ✅ Data terhapus dari database
6. ✅ Toast "Guru berhasil dihapus"
7. ✅ Data hilang dari tabel
```

---

## 📋 Checklist

### **API Endpoint:**
- [x] GET method dengan filter mapel
- [x] POST method untuk create
- [x] PUT method untuk update
- [x] DELETE method untuk delete
- [x] Include relasi (user, mapel)
- [x] Error handling
- [x] Validation

### **Frontend:**
- [x] Remove mock data
- [x] Add useGuru hook
- [x] Add loading state
- [x] Add error state
- [x] Fix handleSubmit (PUT for update)
- [x] Add delete modal
- [x] Toast notifications
- [x] Auto-refresh after CRUD

### **Testing:**
- [x] CREATE berfungsi
- [x] READ berfungsi
- [x] UPDATE berfungsi (tidak buat data baru)
- [x] DELETE berfungsi (dengan modal)

---

## ✅ Summary

**Status:** ✅ **HALAMAN GURU MENGGUNAKAN DATA REAL-TIME**

**Perubahan:**
- ❌ Mock data dengan useEffect → ✅ Real data dengan SWR
- ❌ Hardcoded array → ✅ Database query via Prisma
- ❌ No API endpoint → ✅ Full CRUD API
- ❌ Alert confirm → ✅ Modal konfirmasi
- ❌ Manual state management → ✅ Auto-refresh dengan mutate()

**Files Created/Modified:**
- ✅ `src/app/api/guru/route.ts` (NEW)
- ✅ `src/hooks/useSWR.ts` (ADD useGuru hook)
- ✅ `src/app/(main)/admin/guru/page.tsx` (UPDATED)

**Halaman guru sekarang 100% menggunakan data real dari database PostgreSQL! 🎉**

---

**Date:** January 27, 2026  
**Version:** 2.2.0  
**Status:** Production Ready
