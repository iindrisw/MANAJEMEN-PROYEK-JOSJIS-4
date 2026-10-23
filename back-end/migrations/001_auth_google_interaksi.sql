-- Jalankan SEKALI di Supabase (SQL Editor) atau: python scripts/run_migration.py
-- Aman dijalankan ulang (IF NOT EXISTS / dedupe dulu).

-- 1) User: dukung login Google (password boleh kosong untuk akun Google)
ALTER TABLE "User" ALTER COLUMN password DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS google_id     VARCHAR(64);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS avatar_url    TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local';
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_google_id ON "User"(google_id) WHERE google_id IS NOT NULL;

-- 2) Like & bookmark: 1 user hanya boleh 1x per resep
DELETE FROM "Resep_like" a USING "Resep_like" b
 WHERE a.id_like > b.id_like AND a.id_user = b.id_user AND a.id_resep = b.id_resep;
DELETE FROM "Resep_simpan" a USING "Resep_simpan" b
 WHERE a.id_simpan > b.id_simpan AND a.id_user = b.id_user AND a.id_resep = b.id_resep;

CREATE UNIQUE INDEX IF NOT EXISTS uq_like_user_resep   ON "Resep_like"(id_user, id_resep);
CREATE UNIQUE INDEX IF NOT EXISTS uq_simpan_user_resep ON "Resep_simpan"(id_user, id_resep);
-- (ON CONFLICT (id_user, id_resep) di kode memakai unique index di atas)

-- 3) Index agar pencarian bahan cepat
CREATE INDEX IF NOT EXISTS idx_resep_bahan_resep ON "Resep_bahan"(id_resep);
CREATE INDEX IF NOT EXISTS idx_resep_bahan_bahan ON "Resep_bahan"(id_bahan);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_bahan_nama_trgm ON bahan USING gin (LOWER(nama_bahan) gin_trgm_ops);
