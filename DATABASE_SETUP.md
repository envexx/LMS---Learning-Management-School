# Database Setup Documentation

## ✅ Prisma Schema - COMPLETE

### Schema Overview
Comprehensive database schema telah dibuat dengan **20+ models** untuk sistem e-learning lengkap.

### Models Created:

#### 1. **Authentication & Users**
- `User` - User accounts dengan role (ADMIN, GURU, SISWA)
- `UserRole` - Enum untuk roles

#### 2. **Master Data**
- `Kelas` - Data kelas (7A, 7B, 8A, etc)
- `MataPelajaran` - Mata pelajaran dengan kode dan jenis

#### 3. **Guru**
- `Guru` - Data guru dengan NIP
- `GuruMapel` - Relasi guru dengan mata pelajaran

#### 4. **Siswa**
- `Siswa` - Data siswa dengan NISN/NIS
- `KartuPelajar` - Kartu identitas siswa

#### 5. **Akademik**
- `Jadwal` - Jadwal pelajaran
- `Presensi` - Data kehadiran siswa
- `Nilai` - Nilai siswa per mapel

#### 6. **Pembelajaran**
- `Materi` - Materi pembelajaran (PDF, Video, etc)
- `Tugas` - Tugas untuk siswa
- `TugasSubmission` - Pengumpulan tugas
- `Ujian` - Data ujian
- `SoalPilihanGanda` - Soal multiple choice
- `SoalEssay` - Soal essay
- `UjianSubmission` - Pengumpulan ujian
- `JawabanPilihanGanda` - Jawaban multiple choice
- `JawabanEssay` - Jawaban essay

### Key Features:
- ✅ Complete relations (One-to-Many, Many-to-Many)
- ✅ Cascade deletes untuk data integrity
- ✅ Unique constraints
- ✅ Timestamps (createdAt, updatedAt)
- ✅ Array fields untuk multiple kelas
- ✅ Optional fields dengan `?`
- ✅ Enums untuk type safety

---

## 🚀 Database Options

### Option 1: PostgreSQL (Production-Ready)

**Pros:**
- Scalable untuk production
- Support advanced features
- Better performance untuk large data

**Setup:**
1. Install PostgreSQL locally atau gunakan cloud (Supabase, Railway, Neon)
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/elearning"
   ```
3. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

### Option 2: SQLite (Development - RECOMMENDED)

**Pros:**
- No server needed
- File-based database
- Perfect untuk development
- Easy setup

**Setup:**
1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
   }
   ```

2. Update `prisma.config.ts`:
   ```ts
   datasource: {
     url: "file:./dev.db"
   }
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

### Option 3: Prisma Postgres (Local Development)

**Pros:**
- Managed by Prisma CLI
- Auto-start/stop
- No manual setup

**Setup:**
```bash
npx prisma dev
```

---

## 📝 Migration Commands

### Create Migration
```bash
npx prisma migrate dev --name migration_name
```

### Apply Migrations
```bash
npx prisma migrate deploy
```

### Reset Database
```bash
npx prisma migrate reset
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Open Prisma Studio (Database GUI)
```bash
npx prisma studio
```

---

## 🌱 Seed Data

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@school.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });

  // Create Kelas
  const kelas7A = await prisma.kelas.create({
    data: {
      nama: '7A',
      tingkat: '7',
      tahunAjaran: '2024/2025',
    },
  });

  // Create Mata Pelajaran
  const matematika = await prisma.mataPelajaran.create({
    data: {
      nama: 'Matematika',
      kode: 'MAT',
      jenis: 'wajib',
      jamPerMinggu: 4,
    },
  });

  // Create Guru
  const guruUser = await prisma.user.create({
    data: {
      email: 'guru@school.com',
      password: await bcrypt.hash('guru123', 10),
      role: 'GURU',
      guru: {
        create: {
          nip: '196501011990031001',
          nama: 'Dr. Budi Hartono, M.Pd',
          email: 'guru@school.com',
          jenisKelamin: 'L',
        },
      },
    },
  });

  // Create Siswa
  const siswaUser = await prisma.user.create({
    data: {
      email: 'siswa@school.com',
      password: await bcrypt.hash('siswa123', 10),
      role: 'SISWA',
      siswa: {
        create: {
          nisn: '0012345678',
          nis: '2024001',
          nama: 'Ahmad Fauzi',
          email: 'siswa@school.com',
          kelasId: kelas7A.id,
          jenisKelamin: 'L',
          tanggalLahir: new Date('2010-05-15'),
          alamat: 'Jl. Merdeka No. 123',
          namaWali: 'Bapak Fauzi',
          noTelpWali: '081234567890',
        },
      },
    },
  });

  console.log('✅ Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Run seed:
```bash
npx prisma db seed
```

---

## 🔧 Prisma Client Usage

### Import Prisma Client
```typescript
import { prisma } from '@/lib/prisma';
```

### Basic Queries

**Find All:**
```typescript
const siswa = await prisma.siswa.findMany();
```

**Find with Filter:**
```typescript
const siswa = await prisma.siswa.findMany({
  where: { kelasId: '7A' },
  include: { kelas: true },
});
```

**Create:**
```typescript
const newSiswa = await prisma.siswa.create({
  data: {
    nisn: '0012345678',
    nama: 'Ahmad Fauzi',
    // ... other fields
  },
});
```

**Update:**
```typescript
const updated = await prisma.siswa.update({
  where: { id: 'xxx' },
  data: { nama: 'New Name' },
});
```

**Delete:**
```typescript
await prisma.siswa.delete({
  where: { id: 'xxx' },
});
```

---

## 📊 Current Status

### ✅ Completed
- [x] Prisma installed
- [x] Schema created (20+ models)
- [x] Prisma Client generated
- [x] Prisma client instance (`src/lib/prisma.ts`)

### ⏳ Pending
- [ ] Database server running
- [ ] Migrations applied
- [ ] Seed data created
- [ ] API routes updated to use Prisma

---

## 🎯 Next Steps

### For Development (Recommended):

1. **Switch to SQLite:**
   ```bash
   # Update schema.prisma
   datasource db {
     provider = "sqlite"
   }
   
   # Update prisma.config.ts
   datasource: {
     url: "file:./dev.db"
   }
   
   # Run migration
   npx prisma migrate dev --name init
   ```

2. **Install bcryptjs for password hashing:**
   ```bash
   npm install bcryptjs
   npm install -D @types/bcryptjs
   ```

3. **Create and run seed:**
   ```bash
   npm install -D tsx
   # Create prisma/seed.ts
   npx prisma db seed
   ```

4. **Update API routes to use Prisma**

5. **Test with Prisma Studio:**
   ```bash
   npx prisma studio
   ```

### For Production:

1. Setup PostgreSQL database (Supabase/Railway/Neon)
2. Update DATABASE_URL
3. Run migrations
4. Deploy

---

## 🔗 Useful Links

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Prisma Studio](https://www.prisma.io/studio)
- [Supabase](https://supabase.com) - Free PostgreSQL
- [Railway](https://railway.app) - Free PostgreSQL
- [Neon](https://neon.tech) - Serverless PostgreSQL

---

## ✅ Summary

**Database Schema: 100% Complete**

Semua model sudah dibuat dengan relasi lengkap. Tinggal:
1. Pilih database (SQLite untuk dev, PostgreSQL untuk production)
2. Run migrations
3. Seed data
4. Update API routes

**Ready to go! 🚀**
