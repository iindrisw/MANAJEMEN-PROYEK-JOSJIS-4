"""Like & bookmark resep (wajib login). Idempoten: like dua kali tidak menambah hitungan."""
from sqlalchemy import text

from src.config.database import get_engine
from src.config.settings import Settings
from src.models.interaction_model import T_LIKE, T_SIMPAN
from src.models.recipe_model import T_RESEP, resep_ringkas
from src.services.recipe_service import _meta_halaman, lampirkan_lengkap
from src.utils.errors import AppError


def _pastikan_resep_ada(conn, id_resep):
    ada = conn.execute(
        text(f"SELECT 1 FROM {T_RESEP} WHERE id_resep = :i"), {"i": id_resep}
    ).first()
    if not ada:
        raise AppError("Resep tidak ditemukan.", 404, code="RESEP_TIDAK_ADA")


def _jumlah_like(conn, id_resep):
    return conn.execute(
        text(f"SELECT COALESCE(jumlah_like, 0) FROM {T_RESEP} WHERE id_resep = :i"), {"i": id_resep}
    ).scalar_one()


def like(id_user, id_resep):
    with get_engine().begin() as conn:
        _pastikan_resep_ada(conn, id_resep)
        hasil = conn.execute(text(f"""
            INSERT INTO {T_LIKE} (id_user, id_resep) VALUES (:u, :r)
            ON CONFLICT (id_user, id_resep) DO NOTHING
        """), {"u": id_user, "r": id_resep})
        if hasil.rowcount == 1:  # benar-benar like baru
            conn.execute(text(
                f"UPDATE {T_RESEP} SET jumlah_like = COALESCE(jumlah_like, 0) + 1 WHERE id_resep = :r"
            ), {"r": id_resep})
        return {"sudah_like": True, "jumlah_like": _jumlah_like(conn, id_resep)}


def unlike(id_user, id_resep):
    with get_engine().begin() as conn:
        _pastikan_resep_ada(conn, id_resep)
        hasil = conn.execute(text(
            f"DELETE FROM {T_LIKE} WHERE id_user = :u AND id_resep = :r"
        ), {"u": id_user, "r": id_resep})
        if hasil.rowcount >= 1:
            conn.execute(text(f"""
                UPDATE {T_RESEP}
                SET jumlah_like = CASE WHEN COALESCE(jumlah_like, 0) > 0 THEN jumlah_like - 1 ELSE 0 END
                WHERE id_resep = :r
            """), {"r": id_resep})
        return {"sudah_like": False, "jumlah_like": _jumlah_like(conn, id_resep)}


def simpan(id_user, id_resep):
    with get_engine().begin() as conn:
        _pastikan_resep_ada(conn, id_resep)
        conn.execute(text(f"""
            INSERT INTO {T_SIMPAN} (id_user, id_resep) VALUES (:u, :r)
            ON CONFLICT (id_user, id_resep) DO NOTHING
        """), {"u": id_user, "r": id_resep})
    return {"sudah_simpan": True}


def hapus_simpan(id_user, id_resep):
    with get_engine().begin() as conn:
        _pastikan_resep_ada(conn, id_resep)
        conn.execute(text(
            f"DELETE FROM {T_SIMPAN} WHERE id_user = :u AND id_resep = :r"
        ), {"u": id_user, "r": id_resep})
    return {"sudah_simpan": False}


def _daftar_milik_user(tabel, id_user, halaman):
    params = {
        "u": id_user,
        "limit": Settings.PAGE_SIZE,
        "offset": (halaman - 1) * Settings.PAGE_SIZE,
    }
    with get_engine().connect() as conn:
        total = conn.execute(text(f"SELECT COUNT(*) FROM {tabel} WHERE id_user = :u"), params).scalar_one()
        rows = conn.execute(text(f"""
            SELECT r.id_resep, r.nama_resep, r.jumlah_like, r.url
            FROM {tabel} x JOIN {T_RESEP} r ON r.id_resep = x.id_resep
            WHERE x.id_user = :u
            ORDER BY x.created_at DESC, r.id_resep DESC
            LIMIT :limit OFFSET :offset
        """), params).mappings().all()
        data = [resep_ringkas(r) for r in rows]
        lampirkan_lengkap(conn, data, id_user)
    return {"data": data, **_meta_halaman(total, halaman)}


def daftar_like(id_user, halaman):
    return _daftar_milik_user(T_LIKE, id_user, halaman)


def daftar_simpan(id_user, halaman):
    return _daftar_milik_user(T_SIMPAN, id_user, halaman)
