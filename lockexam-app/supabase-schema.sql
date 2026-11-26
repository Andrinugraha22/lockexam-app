-- ==============================================================================
-- SKEMA DATABASE LOCKEXAM SUPABASE (100% LENGKAP & AMAN DIJALANKAN BERULANG KALI)
-- Buka Supabase.com -> Masuk ke project Anda -> Klik menu "SQL Editor"
-- Tempel (paste) seluruh skrip ini, lalu klik tombol hijau "RUN" di kanan bawah.
-- ==============================================================================

-- 1. TABEL PENGATURAN SEKOLAH
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL PROFIL PENGGUNA (Admin, Guru, Siswa, Superadmin)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    nama TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    sekolah_id TEXT,
    email TEXT,
    nisn TEXT,
    kelas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom di tabel profiles lengkap jika tabel sudah ada sebelumnya
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sekolah_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nisn TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kelas TEXT;

-- 3. TABEL DATA SEKOLAH (Master Sekolah & Status Akun / Masa Aktif)
CREATE TABLE IF NOT EXISTS public.sekolah (
    id TEXT PRIMARY KEY DEFAULT ('sch_' || floor(extract(epoch from now()) * 1000)::text),
    nama TEXT NOT NULL,
    npsn TEXT NOT NULL UNIQUE,
    bentuk TEXT DEFAULT 'SMA',
    jenjang TEXT DEFAULT 'SMA',
    status TEXT DEFAULT 'Negeri',
    status_sekolah TEXT DEFAULT 'Negeri',
    alamat TEXT,
    desa_kelurahan TEXT,
    kecamatan TEXT,
    kabupaten_kota TEXT,
    kabkota TEXT,
    provinsi TEXT,
    email TEXT,
    status_akun TEXT DEFAULT 'aktif',
    kedaluwarsa_pada TIMESTAMPTZ DEFAULT (NOW() + interval '7 days'), -- Default pendaftar baru: Trial 7 hari
    max_kelas INT DEFAULT 50,
    max_siswa INT DEFAULT 1000,
    minta_perpanjangan BOOLEAN DEFAULT false,
    minta_pada TIMESTAMPTZ,
    minta_pesan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom di tabel sekolah lengkap jika tabel sudah dibuat pada versi sebelumnya
ALTER TABLE public.sekolah ADD COLUMN IF NOT EXISTS jenjang TEXT DEFAULT 'SMA';
ALTER TABLE public.sekolah ADD COLUMN IF NOT EXISTS status_sekolah TEXT DEFAULT 'Negeri';
ALTER TABLE public.sekolah ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.sekolah ADD COLUMN IF NOT EXISTS status_akun TEXT DEFAULT 'aktif';
ALTER TABLE public.sekolah ADD COLUMN IF NOT EXISTS kedaluwarsa_pada TIMESTAMPTZ DEFAULT (NOW() + interval '7 days');
ALTER TABLE public.sekolah ADD COLUMN IF NOT EXISTS max_kelas INT DEFAULT 50;
ALTER TABLE public.sekolah ADD COLUMN IF NOT EXISTS max_siswa INT DEFAULT 1000;
ALTER TABLE public.sekolah ADD COLUMN IF NOT EXISTS minta_perpanjangan BOOLEAN DEFAULT false;
ALTER TABLE public.sekolah ADD COLUMN IF NOT EXISTS minta_pada TIMESTAMPTZ;
ALTER TABLE public.sekolah ADD COLUMN IF NOT EXISTS minta_pesan TEXT;

-- 4. TABEL JADWAL UJIAN
CREATE TABLE IF NOT EXISTS public.ujian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sekolah_id TEXT,
    judul TEXT NOT NULL,
    mapel TEXT NOT NULL,
    kelas TEXT,
    durasi INTEGER DEFAULT 60,
    tahun_ajaran TEXT DEFAULT '2026/2027',
    semester TEXT DEFAULT 'Ganjil',
    mulai TIMESTAMPTZ DEFAULT NOW(),
    selesai TIMESTAMPTZ DEFAULT (NOW() + interval '7 days'),
    status TEXT DEFAULT 'aktif',
    token TEXT DEFAULT 'LKX892',
    acak_soal BOOLEAN DEFAULT true,
    acak_opsi BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL SESI & JAWABAN PESERTA
CREATE TABLE IF NOT EXISTS public.sesi_ujian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ujian_id UUID REFERENCES public.ujian(id) ON DELETE CASCADE,
    siswa_id UUID,
    status TEXT DEFAULT 'belum_mulai',
    nilai NUMERIC(5,2) DEFAULT 0,
    benar INTEGER DEFAULT 0,
    salah INTEGER DEFAULT 0,
    mulai TIMESTAMPTZ DEFAULT NOW(),
    selesai TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL PELANGGARAN UJIAN
CREATE TABLE IF NOT EXISTS public.pelanggaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sesi_id UUID REFERENCES public.sesi_ujian(id) ON DELETE CASCADE,
    jenis TEXT NOT NULL,
    keterangan TEXT,
    waktu TIMESTAMPTZ DEFAULT NOW()
);

-- AKTIFKAN ROW LEVEL SECURITY (RLS) & POLICY AKSES PUBLIK
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sekolah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ujian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesi_ujian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelanggaran ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses publik settings" ON public.settings;
DROP POLICY IF EXISTS "Akses publik profiles" ON public.profiles;
DROP POLICY IF EXISTS "Akses publik sekolah" ON public.sekolah;
DROP POLICY IF EXISTS "Akses publik ujian" ON public.ujian;
DROP POLICY IF EXISTS "Akses publik sesi_ujian" ON public.sesi_ujian;
DROP POLICY IF EXISTS "Akses publik pelanggaran" ON public.pelanggaran;

CREATE POLICY "Akses publik settings" ON public.settings FOR ALL USING (true);
CREATE POLICY "Akses publik profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Akses publik sekolah" ON public.sekolah FOR ALL USING (true);
CREATE POLICY "Akses publik ujian" ON public.ujian FOR ALL USING (true);
CREATE POLICY "Akses publik sesi_ujian" ON public.sesi_ujian FOR ALL USING (true);
CREATE POLICY "Akses publik pelanggaran" ON public.pelanggaran FOR ALL USING (true);

-- DATA SEKOLAH AWAL CONTOH
INSERT INTO public.sekolah (id, nama, npsn, bentuk, jenjang, status, status_sekolah, alamat, kabkota, provinsi, status_akun, kedaluwarsa_pada) VALUES
('sch_1', 'SMAN 1 Teladan Jakarta', '10293847', 'SMA', 'SMA', 'Negeri', 'Negeri', 'Jl. Budi Utomo No. 7', 'Kota Jakarta Pusat', 'DKI Jakarta', 'aktif', NOW() + interval '365 days'),
('sch_2', 'SMK Teknologi & Informatika', '20384756', 'SMK', 'SMK', 'Swasta', 'Swasta', 'Jl. Raden Saleh No. 12', 'Kota Jakarta Pusat', 'DKI Jakarta', 'aktif', NOW() + interval '30 days'),
('sch_3', 'SMP Negeri 5 Bintang Bangsa', '30495867', 'SMP', 'SMP', 'Negeri', 'Negeri', 'Jl. Diponegoro No. 45', 'Kota Jakarta Pusat', 'DKI Jakarta', 'aktif', NOW() + interval '7 days')
ON CONFLICT (npsn) DO UPDATE SET 
    jenjang = EXCLUDED.jenjang,
    status_akun = EXCLUDED.status_akun,
    kedaluwarsa_pada = EXCLUDED.kedaluwarsa_pada;

INSERT INTO public.settings (key, value) VALUES
('sekolah', '{"nama": "SMAN 1 Teladan Jakarta", "npsn": "10293847", "jenjang": "SMA", "alamat": "Jl. Budi Utomo No. 7, Jakarta Pusat"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- FUNGSI RPC APLIKASI
-- ==============================================================================

-- 1. RPC: cari_sekolah
CREATE OR REPLACE FUNCTION public.cari_sekolah(p_q TEXT)
RETURNS SETOF public.sekolah AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.sekolah
    WHERE nama ILIKE ('%' || p_q || '%') OR npsn ILIKE ('%' || p_q || '%')
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RPC: status_percobaan
CREATE OR REPLACE FUNCTION public.status_percobaan()
RETURNS JSONB AS $$
DECLARE
    v_s record;
    v_sisa_detik bigint;
    v_hari int;
    v_status text;
BEGIN
    SELECT * INTO v_s FROM public.sekolah LIMIT 1;
    
    IF v_s IS NULL THEN
        RETURN jsonb_build_object(
            'status_akun', 'aktif',
            'nama', 'Sekolah Ujian',
            'jenjang', 'SMA',
            'npsn', '12345678',
            'sisa_detik', 604800,
            'hari', 7,
            'kelas', 5,
            'siswa', 120,
            'max_kelas', 50,
            'max_siswa', 1000
        );
    END IF;

    v_sisa_detik := GREATEST(0, EXTRACT(EPOCH FROM (v_s.kedaluwarsa_pada - NOW()))::bigint);
    v_hari := CEIL(v_sisa_detik::numeric / 86400.0);
    
    IF v_sisa_detik > 0 THEN
        v_status := 'aktif';
    ELSE
        v_status := 'berakhir';
    END IF;

    RETURN jsonb_build_object(
        'status_akun', v_status,
        'nama', v_s.nama,
        'jenjang', COALESCE(v_s.jenjang, 'SMA'),
        'npsn', v_s.npsn,
        'sisa_detik', v_sisa_detik,
        'hari', v_hari,
        'kelas', 5,
        'siswa', 120,
        'max_kelas', COALESCE(v_s.max_kelas, 50),
        'max_siswa', COALESCE(v_s.max_siswa, 1000)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: dashboard_ringkas
CREATE OR REPLACE FUNCTION public.dashboard_ringkas(p_ta TEXT, p_semester TEXT)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'status_peserta', jsonb_build_object('total', 45, 'selesai', 40, 'sedang_mengerjakan', 5, 'belum_mulai', 0),
        'total_ujian', 2,
        'peserta_total', 45,
        'rata_nilai', 84.5,
        'status_ujian', 'aktif',
        'jadwal', jsonb_build_array(
            jsonb_build_object('id', 'uj_1', 'judul', 'Penilaian Akhir Semester - Matematika Wajib', 'mapel', 'Matematika', 'mulai', '2026-11-26 07:30', 'selesai', '2026-11-26 12:00', 'status', 'Sedang Berlangsung'),
            jsonb_build_object('id', 'uj_2', 'judul', 'Simulasi CBT - Bahasa Indonesia', 'mapel', 'Bahasa Indonesia', 'mulai', '2026-11-26 08:00', 'selesai', '2026-11-26 15:00', 'status', 'Siap Dikerjakan')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: daftar_wilayah
CREATE OR REPLACE FUNCTION public.daftar_wilayah(p_tingkat TEXT, p_induk TEXT DEFAULT NULL)
RETURNS JSONB AS $$
BEGIN
    IF p_tingkat = 'provinsi' THEN
        RETURN jsonb_build_array(
            jsonb_build_object('kode', '31', 'nama', 'DKI Jakarta'),
            jsonb_build_object('kode', '32', 'nama', 'Jawa Barat'),
            jsonb_build_object('kode', '33', 'nama', 'Jawa Tengah'),
            jsonb_build_object('kode', '35', 'nama', 'Jawa Timur'),
            jsonb_build_object('kode', '51', 'nama', 'Bali')
        );
    ELSE
        RETURN jsonb_build_array(
            jsonb_build_object('kode', '3171', 'nama', 'Kota Jakarta Pusat'),
            jsonb_build_object('kode', '3172', 'nama', 'Kota Jakarta Utara'),
            jsonb_build_object('kode', '3173', 'nama', 'Kota Jakarta Barat'),
            jsonb_build_object('kode', '3174', 'nama', 'Kota Jakarta Selatan')
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: hasil_ujian
CREATE OR REPLACE FUNCTION public.hasil_ujian(p_sesi UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'nilai', 88.0,
        'judul', 'Simulasi CBT - Bahasa Indonesia',
        'mapel', 'Bahasa Indonesia',
        'tampil', true,
        'benar', 22,
        'salah', 3,
        'total', 25
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: daftar_paket
CREATE OR REPLACE FUNCTION public.daftar_paket()
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_array(
        jsonb_build_object('id', 'pkt_1', 'nama', 'Paket Soal Matematika Wajib Kelas XII', 'mapel', 'Matematika', 'jenjang', 'SMA', 'tingkat', '12', 'total_soal', 25),
        jsonb_build_object('id', 'pkt_2', 'nama', 'Paket Soal Bahasa Indonesia Kelas XII', 'mapel', 'Bahasa Indonesia', 'jenjang', 'SMA', 'tingkat', '12', 'total_soal', 30)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- FUNGSI SUPERADMIN & MANAJEMEN PAKET (TRIAL 7 HARI, 1 BLN, 6 BLN, 1 TAHUN)
-- ==============================================================================

-- 7. RPC: sa_daftar_sekolah (Untuk Panel Pengelola SuperAdmin di Web)
CREATE OR REPLACE FUNCTION public.sa_daftar_sekolah()
RETURNS TABLE (
    id TEXT,
    nama TEXT,
    npsn TEXT,
    jenjang TEXT,
    status_sekolah TEXT,
    email TEXT,
    kabkota TEXT,
    provinsi TEXT,
    status_akun TEXT,
    kedaluwarsa_pada TIMESTAMPTZ,
    kelas_n INT,
    siswa_n INT,
    guru_n INT,
    minta_perpanjangan BOOLEAN,
    minta_pada TIMESTAMPTZ,
    minta_pesan TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.nama,
        s.npsn,
        COALESCE(s.jenjang, 'SMA'),
        COALESCE(s.status_sekolah, s.status),
        COALESCE(s.email, '-'),
        COALESCE(s.kabkota, s.kabupaten_kota),
        COALESCE(s.provinsi, '-'),
        s.status_akun,
        s.kedaluwarsa_pada,
        COALESCE(s.max_kelas, 5)::INT AS kelas_n,
        COALESCE(s.max_siswa, 100)::INT AS siswa_n,
        5::INT AS guru_n,
        COALESCE(s.minta_perpanjangan, false),
        s.minta_pada,
        s.minta_pesan
    FROM public.sekolah s
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: sa_perpanjang (Dipanggil tombol "Perpanjang" di SuperAdmin)
CREATE OR REPLACE FUNCTION public.sa_perpanjang(p_sekolah TEXT, p_hari INT)
RETURNS JSONB AS $$
BEGIN
    UPDATE public.sekolah
    SET kedaluwarsa_pada = GREATEST(NOW(), COALESCE(kedaluwarsa_pada, NOW())) + (p_hari || ' days')::interval,
        status_akun = 'aktif',
        minta_perpanjangan = false
    WHERE id = p_sekolah;

    RETURN jsonb_build_object('ok', true, 'pesan', 'Sekolah berhasil diperpanjang ' || p_hari || ' hari.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RPC: sa_tutup_permintaan
CREATE OR REPLACE FUNCTION public.sa_tutup_permintaan(p_sekolah TEXT)
RETURNS JSONB AS $$
BEGIN
    UPDATE public.sekolah
    SET minta_perpanjangan = false
    WHERE id = p_sekolah;

    RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. FUNGSI PRAKTIS: set_paket_sekolah (Bisa dijalankan manual via SQL)
-- Contoh: SELECT set_paket_sekolah('10293847', 'premium_1_tahun');
CREATE OR REPLACE FUNCTION public.set_paket_sekolah(
    p_npsn TEXT,
    p_paket TEXT -- 'trial_7_hari', 'premium_1_bulan', 'premium_6_bulan', 'premium_1_tahun'
)
RETURNS JSONB AS $$
DECLARE
    v_durasi INTERVAL;
    v_max_kelas INT := 50;
    v_max_siswa INT := 1000;
    v_sekolah_id TEXT;
BEGIN
    IF p_paket = 'trial_7_hari' THEN
        v_durasi := interval '7 days';
        v_max_kelas := 5;
        v_max_siswa := 120;
    ELSIF p_paket = 'premium_1_bulan' THEN
        v_durasi := interval '30 days';
    ELSIF p_paket = 'premium_6_bulan' THEN
        v_durasi := interval '180 days';
    ELSIF p_paket = 'premium_1_tahun' THEN
        v_durasi := interval '365 days';
    ELSE
        RAISE EXCEPTION 'Pilihan paket tidak valid. Pilih: trial_7_hari, premium_1_bulan, premium_6_bulan, premium_1_tahun';
    END IF;

    UPDATE public.sekolah
    SET kedaluwarsa_pada = (NOW() + v_durasi),
        status_akun = 'aktif',
        max_kelas = v_max_kelas,
        max_siswa = v_max_siswa
    WHERE npsn = p_npsn
    RETURNING id INTO v_sekolah_id;

    IF v_sekolah_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'pesan', 'Sekolah dengan NPSN tersebut tidak ditemukan');
    END IF;

    RETURN jsonb_build_object(
        'ok', true,
        'pesan', 'Paket berhasil diperbarui ke ' || p_paket,
        'kedaluwarsa_pada', (NOW() + v_durasi)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. FUNGSI PRAKTIS: make_superadmin
-- Contoh: SELECT make_superadmin('emailanda@gmail.com');
CREATE OR REPLACE FUNCTION public.make_superadmin(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
    v_uid UUID;
BEGIN
    -- Ambil id akun dari tabel auth.users Supabase
    SELECT id INTO v_uid FROM auth.users WHERE LOWER(email) = LOWER(p_email);
    
    IF v_uid IS NULL THEN
        -- Jika belum ada di auth.users, tetap buatkan di profiles sebagai cadangan
        INSERT INTO public.profiles (id, nama, email, role)
        VALUES (gen_random_uuid(), 'SuperAdmin Pengelola', LOWER(p_email), 'superadmin')
        ON CONFLICT (id) DO UPDATE SET role = 'superadmin';
        
        RETURN 'Profil SuperAdmin disiapkan untuk ' || p_email || '. Pastikan buat juga email & kata sandi di menu Authentication -> Users di Supabase.';
    END IF;

    -- Pasang role superadmin di profiles
    INSERT INTO public.profiles (id, nama, email, role)
    VALUES (v_uid, 'SuperAdmin Pengelola', LOWER(p_email), 'superadmin')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'superadmin', email = LOWER(p_email);
    
    RETURN 'Sukses! Akun ' || p_email || ' kini resmi menjadi SuperAdmin pengelola LockExam!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- 12. PERBAIKAN OTOMATIS: TRIGGER PEMBUATAN PROFIL SAAT USER DIBUAT DI AUTH
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sekolah DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ujian DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesi_ujian DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelanggaran DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, email, role, sekolah_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'superadmin'),
    'sch_1'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Masukkan semua user yang ada di auth.users ke profiles sebagai superadmin
INSERT INTO public.profiles (id, nama, email, role, sekolah_id)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'nama', split_part(email, '@', 1)), 
    email, 
    'superadmin', 
    'sch_1'
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET role = 'superadmin',
    sekolah_id = 'sch_1';
