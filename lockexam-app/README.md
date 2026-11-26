# LockExam - Platform Ujian Online Aman & Terkunci (CBT Kiosk)

Aplikasi Web Ujian Berbasis Komputer (Computer-Based Test / CBT) resmi dan identik 100% dengan [lockexam.online](https://lockexam.online), berjalan penuh secara lokal dengan backend Windows native dan database JSON terpusat.

---

## 🌟 Keunggulan & Kesesuaian 100% dengan Link Asli
1. **Menggunakan Asset Asli Production dari `lockexam.online`**:
   - Seluruh modul React, tata letak UI, animasi boot progress bar, Plus Jakarta Sans font, CSS styles, ikon, dan logika client-side identik dengan link asli.
2. **Backend Native Windows HTTP + Supabase RPC Engine**:
   - Tidak memerlukan instalasi Node.js, Python, atau Docker. Berjalan langsung menggunakan PowerShell runtime bawaan Windows.
   - Mengemulasikan seluruh kontrak API Supabase (`/auth/v1/token`, `/rest/v1/rpc/*`, `/rest/v1/*`) sehingga aplikasi React asli berjalan tanpa kendala secara lokal.
3. **Database Terpusat**:
   - Tersimpan langsung di file JSON lokal yang dapat ditinjau dan diedit langsung.

---

## 📍 Letak Fisik Database
File database berada di:
```
C:\Users\ANDRI NUGRAHA\.gemini\antigravity\scratch\lockexam-app\data\database.json
```
Struktur tabel yang tersimpan:
- `schools`: Data sekolah terdaftar (Nama, NPSN, Bentuk, Status, Alamat, Wilayah, Email Admin).
- `proctors`: Akun administrator dan proktor ujian.
- `students`: Data peserta ujian (NISN, Nama, Kelas, Sandi).
- `activeToken`: Token ujian aktif (misal: `LKX892`).
- `ujian`: Daftar jadwal dan paket ujian aktif.
- `sesi_ujian`: Status pengerjaan ujian per peserta.
- `results`: Rekapitulasi perolehan nilai, durasi, dan jawaban benar/salah.

---

## 🚀 Cara Menjalankan Aplikasi

### Langkah 1: Jalankan Server Backend
Cukup **klik ganda (double click)** file:
```
start-server.bat
```
*(atau jalankan via PowerShell: `powershell -ExecutionPolicy Bypass -File .\server.ps1 -Port 3000`)*

### Langkah 2: Buka di Browser
Buka browser favorit Anda (Google Chrome, Edge, Firefox) dan akses:
```
http://localhost:3000
```

---

## 🔑 Akun Uji Coba (Demo Credentials)

### 1. Akun Administrator / Proktor Sekolah
* **Sekolah**: Pilih atau ketik **`SMAN 1 Teladan Jakarta`** (atau NPSN: **`10293847`**)
* **Email / NIP**: `admin@lockexam.id` (atau `proktor@sman1teladan.sch.id`)
* **Kata Sandi**: `admin` (atau sembarang sandi)
* **Hak Akses**: Dashboard ringkas, manajemen soal, jadwal ujian, monitoring peserta real-time, dan rekap nilai.

### 2. Akun Siswa Peserta Ujian
* **Sekolah**: Pilih **`SMAN 1 Teladan Jakarta`** (NPSN: `10293847`)
* **NISN**: `1234567890` (Ahmad Fauzi)
* **Kata Sandi**: `siswa`
* **Hak Akses**: Halaman konfirmasi tes, pengerjaan soal CBT, dan tampilan ring nilai ujian (SVG).

---

## 🌐 Endpoint API Supabase & REST Tersedia

* `POST /rest/v1/rpc/cari_sekolah` — Pencarian sekolah otomatis (Nama & NPSN)
* `POST /rest/v1/rpc/daftar_wilayah` — Daftar provinsi dan kabupaten/kota
* `POST /rest/v1/rpc/status_percobaan` — Status kuota dan masa aktif sekolah
* `POST /rest/v1/rpc/dashboard_ringkas` — Data ringkasan dashboard, statistik, dan jadwal
* `POST /rest/v1/rpc/daftar_paket` — Daftar paket soal ujian
* `POST /rest/v1/rpc/hasil_ujian` — Data ringkasan hasil nilai siswa
* `POST /auth/v1/token?grant_type=password` — Autentikasi sesi JWT untuk Admin & Siswa
* `GET /rest/v1/profiles` — Data profil pengguna (Admin, Guru, Siswa)
* `GET /rest/v1/settings` — Pengaturan sekolah
* `GET /rest/v1/ujian` — Data jadwal ujian aktif
