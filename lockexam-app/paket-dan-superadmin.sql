-- ==============================================================================
-- PANDUAN SQL UNTUK MENGATUR DURASI PAKET & SUPERADMIN
-- Jalankan di SQL Editor Supabase Anda
-- ==============================================================================

-- 1. FUNGSI UNTUK MENGUBAH / MENGATUR PAKET SEKOLAH SECARA INSTAN
-- Contoh cara pakai: SELECT set_paket_sekolah('NPSN_SEKOLAH', 'premium_1_tahun');
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

-- 2. FUNGSI UNTUK MENJADIKAN AKUN ANDA SEBAGAI SUPERADMIN (PENGELOLA UTAMA)
-- Contoh cara pakai: SELECT make_superadmin('email_anda@gmail.com');
CREATE OR REPLACE FUNCTION public.make_superadmin(p_email TEXT)
RETURNS TEXT AS $$
BEGIN
    UPDATE public.profiles
    SET role = 'superadmin'
    WHERE email = LOWER(p_email);
    
    RETURN 'Akun ' || p_email || ' kini menjadi SuperAdmin pengelola LockExam!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
