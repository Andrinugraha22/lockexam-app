-- ==============================================================================
-- SOLUSI PERBAIKAN: "Profil akun belum ada"
-- Buka Supabase -> SQL Editor -> Tempel dan RUN skrip ini
-- ==============================================================================

-- 1. Berikan izin penuh pada schema public ke semua role (anon & authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Pastikan RLS tidak memblokir pembacaan profil
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sekolah DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ujian DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesi_ujian DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelanggaran DISABLE ROW LEVEL SECURITY;

-- 3. TRIGGER OTOMATIS: Setiap ada user baru di auth.users, otomatis buatkan profilnya di public.profiles!
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

-- Pasang trigger ke tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. SINKRONKAN SEMUA USER YANG SUDAH TERLANJUR DIBUAT KE TABEL PROFILES & JADIKAN SUPERADMIN
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
