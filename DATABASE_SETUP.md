# Database Setup untuk Production (Coolify)

## 📋 Prasyarat

Pastikan environment variables sudah di-set di Coolify:
- `DATABASE_URL=postgres://postgres:T1ZjVSlg9DuhDVoDqq6EmGC81zufSuyyTGhpbX3DejKzZyCSLxsCCl8twkMaZj29@31.97.67.141:5436/postgres`
- `DIRECT_URL=postgres://postgres:T1ZjVSlg9DuhDVoDqq6EmGC81zufSuyyTGhpbX3DejKzZyCSLxsCCl8twkMaZj29@31.97.67.141:5436/postgres`

---

## 🚀 Cara Menjalankan Migration & Seeder di Production

### Metode 1: Via Terminal Coolify (RECOMMENDED)

1. **Masuk ke Container via Coolify Dashboard**
   - Buka Coolify Dashboard
   - Pilih aplikasi Anda
   - Klik **Terminal** (tab di sebelah Logs)
   
2. **Jalankan Migration**
   ```bash
   npx prisma migrate deploy
   ```
   
3. **Jalankan Seeder**
   ```bash
   npx prisma db seed
   ```
   
   Atau gunakan script custom:
   ```bash
   npx tsx prisma/seed.ts
   ```

---

### Metode 2: Via SSH ke Server Coolify

1. **SSH ke Server Coolify**
   ```bash
   ssh user@31.97.67.141
   ```

2. **Cari Container ID**
   ```bash
   docker ps | grep e-learning
   ```

3. **Masuk ke Container**
   ```bash
   docker exec -it <container_id> sh
   ```

4. **Jalankan Migration**
   ```bash
   npx prisma migrate deploy
   ```

5. **Jalankan Seeder**
   ```bash
   npx prisma db seed
   ```

6. **Keluar dari Container**
   ```bash
   exit
   ```

---

### Metode 3: Otomatis saat Deployment (Startup Command)

⚠️ **PERHATIAN**: Metode ini akan menjalankan migration & seed otomatis setiap deployment.
Untuk production, lebih baik gunakan Metode 1 atau 2 secara manual.

**Di Coolify Dashboard:**

1. Pergi ke **Configuration** → **Build Pack**
2. Scroll ke **Custom Start Command**
3. Masukkan command:
   ```bash
   npx prisma migrate deploy && npx prisma db seed && node server.js
   ```
   
   Atau tanpa seeding (hanya migration):
   ```bash
   npx prisma migrate deploy && node server.js
   ```

4. Save dan redeploy

---

## 📝 Command Reference

### Migration Commands

```bash
# Deploy pending migrations (production)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Generate Prisma Client (jika belum ter-generate)
npx prisma generate
```

### Seeder Commands

```bash
# Main seeder (prisma/seed.ts)
npx prisma db seed
# atau
npx tsx prisma/seed.ts

# Custom seeders
npx tsx prisma/seed-info-masuk.ts
npx tsx prisma/seed-dummy-ujian.ts
```

### Database Commands

```bash
# Check database connection
npx prisma db pull --print

# Reset database (DANGER: Deletes all data!)
# DON'T USE IN PRODUCTION!
npx prisma migrate reset
```

---

## 🔑 Login Credentials (After Seeding)

Setelah menjalankan seeder, gunakan credentials berikut:

**Admin:**
- Email: `admin@school.com`
- Password: `admin123`

**Guru:**
- Email: `budi.hartono@school.com`
- Password: `guru123`

**Siswa:**
- Email: `ahmad.rizki@student.com`
- Password: `siswa123`
- NISN: `0012345678`

---

## ⚠️ Catatan Penting

1. **Seeder akan menghapus semua data yang ada!**
   - File `prisma/seed.ts` memiliki `deleteMany()` untuk semua tabel
   - Jika ingin mempertahankan data existing, comment out bagian `deleteMany()`

2. **Migration hanya sekali**
   - `prisma migrate deploy` hanya menjalankan migration yang belum dijalankan
   - Aman untuk dijalankan berkali-kali

3. **Seeder bisa dijalankan berkali-kali**
   - Tapi akan reset semua data kembali ke initial state

4. **Database Backup**
   - Selalu backup database sebelum menjalankan seeder di production
   - Di Coolify, backup database via PostgreSQL container

---

## 🐛 Troubleshooting

### Error: "Prisma CLI not found"

```bash
# Install dependencies dulu
npm ci

# Generate Prisma Client
npx prisma generate
```

### Error: "Can't reach database server"

- Cek koneksi `DATABASE_URL` di environment variables
- Pastikan PostgreSQL container running
- Test koneksi: `npx prisma db pull --print`

### Error: "Permission denied"

Jika ada error permission:
```bash
# Switch ke root user
docker exec -it -u root <container_id> sh

# Jalankan migration
npx prisma migrate deploy

# Exit
exit
```

---

## 📚 Resource

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Seeding Documentation](https://www.prisma.io/docs/guides/database/seed-database)
