# Sistem Autentikasi & Middleware

Dokumentasi lengkap sistem autentikasi berbasis role dengan session management menggunakan iron-session dan SWR.

## 📋 Fitur Utama

1. **Session-based Authentication** dengan iron-session
2. **Role-based Access Control (RBAC)** - ADMIN, GURU, SISWA
3. **Middleware Protection** untuk route berdasarkan role
4. **SWR Hooks** untuk state management user yang real-time
5. **User ID Tracking** untuk filtering data per user

## 🔧 Komponen Sistem

### 1. Session Management (`src/lib/session.ts`)

```typescript
// Session data structure
interface SessionData {
  userId: string;
  email: string;
  role: 'ADMIN' | 'GURU' | 'SISWA';
  isLoggedIn: boolean;
}
```

**Fungsi:**
- `getSession()` - Mendapatkan session saat ini
- `createSession(data)` - Membuat session baru setelah login
- `destroySession()` - Menghapus session saat logout

### 2. API Endpoints

#### `/api/auth/login` (POST)
Login user dengan email dan password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "userId": "user_id",
    "email": "user@example.com",
    "role": "ADMIN",
    "profile": {
      "id": "profile_id",
      "nama": "Nama User",
      ...
    }
  }
}
```

#### `/api/auth/logout` (POST)
Logout user dan hapus session.

#### `/api/auth/session` (GET)
Mendapatkan data session user yang sedang login.

**Response:**
```json
{
  "success": true,
  "isLoggedIn": true,
  "data": {
    "userId": "user_id",
    "email": "user@example.com",
    "role": "SISWA",
    "profile": {
      "id": "siswa_id",
      "nama": "Nama Siswa",
      "nis": "12345",
      "kelasId": "kelas_id",
      "kelas": { ... }
    }
  }
}
```

### 3. Middleware (`src/middleware.ts`)

Middleware otomatis melindungi semua route kecuali:
- `/login`
- `/api/auth/*`
- Static files (`/_next`, `/static`, dll)

**Route Access Rules:**
```typescript
const routeAccess = {
  '/admin': ['ADMIN'],
  '/guru': ['GURU'],
  '/siswa': ['SISWA'],
};
```

**Behavior:**
- User tidak login → redirect ke `/login`
- User dengan role salah → redirect ke dashboard sesuai role mereka
- User akses root `/` → redirect ke dashboard sesuai role

### 4. SWR Hooks (`src/hooks/useAuth.ts`)

#### `useAuth(requireAuth = true)`

Hook utama untuk autentikasi.

**Return Values:**
```typescript
{
  user: SessionData | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  error: any,
  login: (email, password) => Promise,
  logout: () => Promise,
  mutate: () => void
}
```

**Contoh Penggunaan:**
```typescript
// Di halaman yang memerlukan autentikasi
const { user, isAuthenticated, logout } = useAuth();

// Di halaman login (tidak perlu autentikasi)
const { login } = useAuth(false);
```

#### `useRequireRole(allowedRoles)`

Hook untuk memastikan user memiliki role tertentu.

**Contoh:**
```typescript
// Hanya ADMIN dan GURU yang bisa akses
const { user, isLoading } = useRequireRole(['ADMIN', 'GURU']);
```

#### `useUserId()`

Hook untuk mendapatkan user ID dan profile ID.

**Return Values:**
```typescript
{
  userId: string | null,      // User ID dari tabel users
  profileId: string | null,   // ID dari tabel siswa/guru
  isLoading: boolean
}
```

**Contoh Penggunaan:**
```typescript
// Filter data berdasarkan user yang login
const { userId, profileId } = useUserId();

// Untuk siswa, ambil nilai berdasarkan siswaId
const { data: nilaiData } = useNilai(profileId);

// Untuk guru, ambil ujian yang dibuat oleh guru ini
const { data: ujianData } = useUjian({ guruId: profileId });
```

## 🚀 Cara Penggunaan

### 1. Setup Environment Variable

Tambahkan di `.env`:
```env
SESSION_SECRET=e-learning-session-secret-key-must-be-at-least-32-characters-long-for-security
```

### 2. Implementasi di Page

#### Halaman dengan Autentikasi Required

```typescript
"use client";

import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1>Welcome, {user?.profile?.nama}</h1>
      <p>Role: {user?.role}</p>
    </div>
  );
}
```

#### Filter Data Berdasarkan User

```typescript
"use client";

import { useUserId } from "@/hooks/useAuth";
import { useNilai } from "@/hooks/useSWR";

export default function NilaiPage() {
  const { profileId } = useUserId();
  const { data: nilaiData } = useNilai(profileId);

  return (
    <div>
      {nilaiData?.map(nilai => (
        <div key={nilai.id}>{nilai.mapel.nama}: {nilai.nilaiAkhir}</div>
      ))}
    </div>
  );
}
```

#### Halaman Login

```typescript
"use client";

import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth(false); // false = tidak perlu autentikasi
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
    // Auto redirect ke dashboard sesuai role
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 3. Implementasi di Component

```typescript
"use client";

import { useAuth } from "@/hooks/useAuth";

export function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <div>
      <p>{user?.profile?.nama}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 🔐 Security Features

1. **HTTP-only Cookies** - Session disimpan di cookie yang tidak bisa diakses JavaScript
2. **Secure Cookies** - Di production, cookie hanya dikirim via HTTPS
3. **Password Hashing** - Password di-hash dengan bcrypt
4. **Session Expiry** - Session expire setelah 7 hari
5. **Active User Check** - Hanya user dengan `isActive: true` yang bisa login
6. **Role Validation** - Setiap request divalidasi role-nya di middleware

## 📊 Data Flow

```
1. User Login
   ↓
2. API validate credentials
   ↓
3. Create session with iron-session
   ↓
4. Return user data + profile
   ↓
5. SWR cache data
   ↓
6. Redirect to role-based dashboard

Setiap Request:
   ↓
Middleware check session
   ↓
Validate role for route
   ↓
Allow/Deny access
```

## 🎯 Best Practices

1. **Selalu gunakan `useAuth()` di client component** untuk mendapatkan user data
2. **Gunakan `useUserId()` untuk filter data** berdasarkan user yang login
3. **Gunakan `useRequireRole()` untuk halaman** yang hanya boleh diakses role tertentu
4. **Jangan hardcode user ID** - selalu ambil dari session
5. **Revalidate session** setelah operasi penting (update profile, dll)

## 🔄 Update Session Data

```typescript
const { mutate } = useAuth();

// Setelah update profile
await updateProfile(data);
await mutate(); // Refresh session data
```

## 📝 Contoh Implementasi Lengkap

### Filter Presensi Siswa

```typescript
"use client";

import { useUserId } from "@/hooks/useAuth";
import { usePresensi } from "@/hooks/useSWR";

export default function PresensiSiswaPage() {
  const { profileId } = useUserId(); // Get siswaId
  const { data: presensiData } = usePresensi({ siswaId: profileId });

  return (
    <div>
      <h1>Presensi Saya</h1>
      {presensiData?.map(p => (
        <div key={p.id}>
          {p.tanggal}: {p.status}
        </div>
      ))}
    </div>
  );
}
```

### Filter Ujian Guru

```typescript
"use client";

import { useUserId } from "@/hooks/useAuth";
import { useUjian } from "@/hooks/useSWR";

export default function UjianGuruPage() {
  const { profileId } = useUserId(); // Get guruId
  const { data: ujianData } = useUjian({ guruId: profileId });

  return (
    <div>
      <h1>Ujian yang Saya Buat</h1>
      {ujianData?.map(u => (
        <div key={u.id}>
          {u.judul} - {u.mapel.nama}
        </div>
      ))}
    </div>
  );
}
```

## 🐛 Troubleshooting

### Session tidak tersimpan
- Pastikan `SESSION_SECRET` sudah di set di `.env`
- Pastikan minimal 32 karakter

### Redirect loop
- Cek middleware matcher config
- Pastikan route login tidak di-protect

### User data tidak muncul
- Cek apakah `useAuth()` dipanggil di client component
- Pastikan session API endpoint berjalan
- Cek console untuk error

## 📚 Dependencies

- `iron-session` - Session management
- `swr` - Data fetching & caching
- `bcryptjs` - Password hashing
- `next` - Framework

## 🎉 Selesai!

Sistem autentikasi sudah siap digunakan. Semua route otomatis terproteksi dan data user bisa diakses dengan mudah menggunakan hooks yang tersedia.
