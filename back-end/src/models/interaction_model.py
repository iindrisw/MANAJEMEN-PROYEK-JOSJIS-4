"""Definisi tabel interaksi user dengan resep (like & bookmark)."""

T_LIKE = '"Resep_like"'      # id_like, id_user, id_resep, created_at  (unik per user+resep)
T_SIMPAN = '"Resep_simpan"'  # id_simpan, id_user, id_resep, created_at (unik per user+resep)
