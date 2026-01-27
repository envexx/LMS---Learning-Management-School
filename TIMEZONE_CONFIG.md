# ⏰ Konfigurasi Timezone Indonesia

## 📍 Timezone yang Digunakan

Aplikasi ini menggunakan **Asia/Jakarta (WIB - GMT+7)** sebagai timezone default.

Indonesia memiliki 3 timezone:
- **WIB** (Waktu Indonesia Barat): Asia/Jakarta - GMT+7
- **WITA** (Waktu Indonesia Tengah): Asia/Makassar - GMT+8  
- **WIT** (Waktu Indonesia Timur): Asia/Jayapura - GMT+9

---

## ⚙️ Konfigurasi

### **File: `.env`**
```env
# Timezone Configuration
TZ=Asia/Jakarta
NEXT_PUBLIC_TIMEZONE=Asia/Jakarta
```

**Untuk mengubah timezone:**
- Ganti `Asia/Jakarta` dengan `Asia/Makassar` (WITA) atau `Asia/Jayapura` (WIT)
- Restart development server

---

## 🛠️ Utility Functions

### **File: `src/lib/date-utils.ts`**

Semua fungsi timezone tersedia di file ini:

```typescript
import { 
  getCurrentDateIndonesia,
  toIndonesiaTime,
  formatIndonesiaDate,
  getStartOfDayIndonesia,
  getEndOfDayIndonesia,
  toISOStringIndonesia
} from '@/lib/date-utils';
```

### **1. Get Current Date/Time**
```typescript
const now = getCurrentDateIndonesia();
// Returns: Date object in Indonesian timezone
```

### **2. Convert Date to Indonesian Time**
```typescript
const date = new Date('2026-01-27T10:00:00Z'); // UTC time
const indonesiaTime = toIndonesiaTime(date);
// Converts to Indonesian timezone
```

### **3. Format Date with Indonesian Timezone**
```typescript
const formatted = formatIndonesiaDate(
  new Date(), 
  'dd MMM yyyy HH:mm'
);
// Returns: "27 Jan 2026 17:30"
```

### **4. Get Start/End of Day**
```typescript
const startOfDay = getStartOfDayIndonesia();
// Returns: Today 00:00:00 in Indonesian timezone

const endOfDay = getEndOfDayIndonesia();
// Returns: Today 23:59:59 in Indonesian timezone
```

### **5. ISO String with Timezone**
```typescript
const isoString = toISOStringIndonesia();
// Returns: ISO string in Indonesian timezone
```

---

## 📝 Penggunaan di Aplikasi

### **1. Presensi Scan API**
```typescript
// src/app/api/presensi/scan/route.ts

import { getCurrentDateIndonesia, getStartOfDayIndonesia } from '@/lib/date-utils';

// Check today's attendance
const todayIndonesia = getStartOfDayIndonesia();
const existingPresensi = await prisma.presensi.findFirst({
  where: {
    siswaId: siswa.id,
    tanggal: { gte: todayIndonesia }
  }
});

// Create attendance with Indonesian time
const presensi = await prisma.presensi.create({
  data: {
    tanggal: getCurrentDateIndonesia(),
    // ...
  }
});
```

### **2. Presensi Display Page**
```typescript
// src/app/(main)/admin/presensi/page.tsx

import { formatIndonesiaDate } from '@/lib/date-utils';

// Display date
<TableCell>
  {formatIndonesiaDate(presensi.tanggal, "dd MMM yyyy")}
</TableCell>

// Display time with WIB indicator
<TableCell>
  {formatIndonesiaDate(presensi.createdAt, "HH:mm")} WIB
</TableCell>
```

### **3. Kartu Pelajar Export**
```typescript
import { formatIndonesiaDate } from '@/lib/date-utils';

const validUntil = new Date(today.getFullYear() + 1, 5, 30);
const formattedDate = formatIndonesiaDate(validUntil, 'dd/MM/yyyy');
```

---

## ⚠️ Penting!

### **Jangan Gunakan:**
```typescript
❌ new Date() // Server timezone, bisa berbeda!
❌ Date.now() // UTC timestamp
❌ format(new Date(), ...) // Tanpa timezone conversion
```

### **Gunakan:**
```typescript
✅ getCurrentDateIndonesia()
✅ toIndonesiaTime(date)
✅ formatIndonesiaDate(date, format)
```

---

## 🔍 Contoh Masalah Timezone

### **Tanpa Timezone Handling:**
```
Server Location: Singapore (GMT+8)
User Location: Jakarta (GMT+7)

Siswa scan jam 06:45 WIB
Server catat: 07:45 (Singapore time)
Database: 2026-01-27 07:45:00
Display: 07:45 ❌ SALAH!
```

### **Dengan Timezone Handling:**
```
Server Location: Singapore (GMT+8)
User Location: Jakarta (GMT+7)

Siswa scan jam 06:45 WIB
Convert to Indonesian: 06:45 WIB
Database: 2026-01-27 06:45:00
Display: 06:45 WIB ✅ BENAR!
```

---

## 🧪 Testing

### **Test Timezone Conversion:**
```typescript
// Test di browser console atau API route
import { getCurrentDateIndonesia, formatIndonesiaDate } from '@/lib/date-utils';

console.log('Current Time (Server):', new Date());
console.log('Current Time (Indonesia):', getCurrentDateIndonesia());
console.log('Formatted:', formatIndonesiaDate(new Date(), 'dd MMM yyyy HH:mm'));
```

### **Expected Output:**
```
Current Time (Server): Mon Jan 27 2026 10:30:00 GMT+0800
Current Time (Indonesia): Mon Jan 27 2026 09:30:00 GMT+0700
Formatted: 27 Jan 2026 09:30
```

---

## 📦 Dependencies

```json
{
  "date-fns": "^3.x.x",
  "date-fns-tz": "^3.x.x"
}
```

Install jika belum ada:
```bash
npm install date-fns date-fns-tz
```

---

## ✅ Checklist Implementation

- ✅ Timezone config di `.env`
- ✅ Utility functions di `src/lib/date-utils.ts`
- ✅ Presensi scan API menggunakan Indonesian timezone
- ✅ Presensi display page menggunakan Indonesian timezone
- ✅ Format waktu dengan "WIB" indicator
- ✅ Documentation lengkap

---

## 🎯 Best Practices

1. **Selalu gunakan utility functions** untuk date/time operations
2. **Tampilkan timezone indicator** (WIB/WITA/WIT) di UI
3. **Test dengan server di timezone berbeda** untuk memastikan akurasi
4. **Dokumentasikan timezone** di setiap fungsi yang handle date/time
5. **Consistent formatting** di seluruh aplikasi

---

## 📞 Support

Jika ada masalah dengan timezone:
1. Cek konfigurasi `.env`
2. Restart development server
3. Clear browser cache
4. Test dengan `console.log()` untuk debug

**Timezone sudah dikonfigurasi dengan benar untuk aplikasi Indonesia!** 🇮🇩
