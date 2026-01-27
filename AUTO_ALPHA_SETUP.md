# ⏰ Auto-Alpha Setup - Presensi Otomatis

## 📋 Fitur

Sistem akan **otomatis menandai siswa sebagai ALPHA** jika mereka tidak scan QR code sebelum **jam 09:00 WIB**.

---

## 🛠️ Cara Kerja

### **Flow:**
```
06:00 - 08:59 → Siswa scan QR code → Status: HADIR
09:00         → Cron job berjalan
              → Cek siswa yang belum scan
              → Auto-create presensi dengan status: ALPHA
09:01+        → Siswa yang terlambat scan tetap bisa (manual override)
```

---

## 📡 API Endpoints

### **1. Auto-Alpha Endpoint**
**URL:** `POST /api/presensi/auto-alpha`

**Fungsi:** Mark siswa yang belum hadir sebagai ALPHA

**Response:**
```json
{
  "success": true,
  "message": "Successfully marked 5 students as ALPHA",
  "totalStudents": 150,
  "presentCount": 145,
  "absentCount": 5,
  "markedAsAlpha": 5,
  "executedAt": "2026-01-27T02:00:00.000Z",
  "absentStudents": [
    { "nisn": "0012345678", "nama": "Ahmad Rizki" },
    { "nisn": "0012345679", "nama": "Siti Nurhaliza" }
  ]
}
```

### **2. Check Status Endpoint**
**URL:** `GET /api/presensi/auto-alpha`

**Fungsi:** Cek status tanpa marking (untuk testing)

**Response:**
```json
{
  "success": true,
  "currentTime": "2026-01-27T08:45:00.000Z",
  "currentHour": 8,
  "shouldRunAutoAlpha": false,
  "totalStudents": 150,
  "presentCount": 140,
  "absentCount": 10,
  "absentStudents": [...],
  "presensiBreakdown": {
    "hadir": 138,
    "izin": 1,
    "sakit": 1,
    "alpha": 0
  }
}
```

### **3. Cron Trigger Endpoint**
**URL:** `GET /api/cron/daily-alpha`

**Headers:**
```
Authorization: Bearer your-cron-secret
```

**Fungsi:** Endpoint yang dipanggil oleh cron job

---

## ⚙️ Setup Options

### **Option 1: Vercel Cron Jobs (Recommended for Production)**

**File:** `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-alpha",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0 2 * * *` = Every day at 02:00 UTC
- 02:00 UTC = 09:00 WIB (GMT+7)

**Setup:**
1. File `vercel.json` sudah dibuat
2. Deploy ke Vercel
3. Cron akan otomatis berjalan setiap hari jam 9 pagi

---

### **Option 2: External Cron Service**

#### **A. cron-job.org (Free)**
1. Daftar di https://cron-job.org
2. Create new cron job:
   - **URL:** `https://your-domain.com/api/cron/daily-alpha`
   - **Schedule:** `0 9 * * *` (9:00 AM daily)
   - **Timezone:** Asia/Jakarta
   - **Headers:** `Authorization: Bearer your-cron-secret`

#### **B. EasyCron (Free tier available)**
1. Daftar di https://www.easycron.com
2. Create cron job dengan settings yang sama

#### **C. GitHub Actions (Free for public repos)**
**File:** `.github/workflows/daily-alpha.yml`
```yaml
name: Daily Alpha Marking
on:
  schedule:
    - cron: '0 2 * * *'  # 9:00 AM WIB
  workflow_dispatch:  # Manual trigger

jobs:
  mark-alpha:
    runs-on: ubuntu-latest
    steps:
      - name: Call Auto-Alpha API
        run: |
          curl -X POST https://your-domain.com/api/cron/daily-alpha \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

### **Option 3: Manual Trigger (Development/Testing)**

#### **Via Browser:**
```
GET https://localhost:3000/api/presensi/auto-alpha
```

#### **Via cURL:**
```bash
# Check status
curl http://localhost:3000/api/presensi/auto-alpha

# Trigger marking
curl -X POST http://localhost:3000/api/presensi/auto-alpha
```

#### **Via Postman:**
1. Method: POST
2. URL: `http://localhost:3000/api/presensi/auto-alpha`
3. Send

---

## 🔐 Security

### **Generate CRON_SECRET:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### **Update .env:**
```env
CRON_SECRET=your-generated-secret-here
```

### **Add to Vercel Environment Variables:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add: `CRON_SECRET` = `your-generated-secret`

---

## 🧪 Testing

### **1. Test Check Status (Safe):**
```bash
curl http://localhost:3000/api/presensi/auto-alpha
```

**Expected:** Returns current status without marking anyone

### **2. Test Manual Trigger:**
```bash
curl -X POST http://localhost:3000/api/presensi/auto-alpha
```

**Expected:** Marks absent students as ALPHA

### **3. Test Cron Endpoint:**
```bash
curl -H "Authorization: Bearer your-cron-secret" \
  http://localhost:3000/api/cron/daily-alpha
```

**Expected:** Triggers auto-alpha via cron endpoint

### **4. Test Time Restriction:**
```bash
# Before 9 AM
curl -X POST http://localhost:3000/api/presensi/auto-alpha
```

**Expected:** Returns message "Auto-alpha only runs at 9:00 AM or later"

---

## 📊 Monitoring

### **Check Logs:**
```bash
# Vercel
vercel logs

# Local
# Check terminal output for:
# "Auto-marked X students as ALPHA at ..."
```

### **Database Check:**
```sql
-- Check today's alpha records
SELECT * FROM presensi 
WHERE status = 'alpha' 
  AND keterangan LIKE '%Auto-marked%'
  AND DATE(tanggal) = CURRENT_DATE;
```

---

## ⚠️ Important Notes

### **1. Timezone Handling:**
- Cron schedule menggunakan UTC
- 09:00 WIB = 02:00 UTC
- Pastikan timezone di `.env` sudah benar

### **2. Duplicate Prevention:**
- Sistem cek siswa yang sudah punya presensi
- Tidak akan create duplicate records
- Safe untuk run multiple times

### **3. Manual Override:**
- Piket bisa ubah status ALPHA ke IZIN/SAKIT
- Via halaman `/admin/presensi`
- Update manual akan tersimpan

### **4. Late Arrivals:**
- Siswa yang datang setelah jam 9
- Bisa scan QR code
- Status ALPHA akan ter-update jadi HADIR
- Atau piket bisa manual update

---

## 🔄 Workflow Lengkap

### **Scenario 1: Normal Day**
```
06:30 → Siswa A scan → HADIR
07:00 → Siswa B scan → HADIR
08:45 → Siswa C scan → HADIR
09:00 → Cron runs → Siswa D & E marked as ALPHA
10:00 → Piket update Siswa D: ALPHA → SAKIT (ada surat)
```

### **Scenario 2: Late Arrival**
```
06:30 → Siswa A scan → HADIR
09:00 → Cron runs → Siswa B marked as ALPHA
09:15 → Siswa B datang terlambat
      → Piket update: ALPHA → HADIR
      → Atau siswa scan ulang (akan update existing record)
```

### **Scenario 3: Sick Leave**
```
09:00 → Cron runs → Siswa C marked as ALPHA
10:00 → Orang tua telpon: anak sakit
      → Piket update: ALPHA → SAKIT
```

---

## ✅ Checklist Setup

- ✅ API endpoint `/api/presensi/auto-alpha` created
- ✅ Cron endpoint `/api/cron/daily-alpha` created
- ✅ `vercel.json` configured for Vercel Cron
- ✅ `.env` updated with `CRON_SECRET`
- ✅ Indonesian timezone handling implemented
- ✅ Duplicate prevention logic added
- ✅ Security with Bearer token
- ✅ Comprehensive logging
- ✅ Testing endpoints available

---

## 🎯 Next Steps

1. **Development:**
   - Test manual trigger
   - Verify data creation
   - Check timezone accuracy

2. **Production:**
   - Generate secure CRON_SECRET
   - Deploy to Vercel
   - Verify cron job runs at 9 AM
   - Monitor for first few days

3. **Optional Enhancements:**
   - Email notification to admin
   - SMS to parents of absent students
   - Dashboard widget showing auto-alpha stats
   - Configurable cutoff time (not hardcoded 9 AM)

---

**Sistem auto-alpha sudah siap digunakan!** 🎉
