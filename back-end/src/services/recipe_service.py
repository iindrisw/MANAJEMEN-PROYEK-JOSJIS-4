"""Logika bisnis resep: pencarian kombinasi bahan, daftar, detail, mode memasak.

SQL ditulis dengan parameter bernama (anti SQL-injection). Kata kunci user di-escape
supaya karakter % dan _ tidak dianggap wildcard.
"""
from functools import lru_cache

from sqlalchemy import text

from src.config.database import get_engine
from src.config.settings import Settings
from src.models.interaction_model import T_LIKE, T_SIMPAN
from src.models.recipe_model import (
    T_BAHAN, T_RESEP, T_RESEP_BAHAN, bahan_item, resep_ringkas,
)
from src.utils.errors import AppError
from src.utils.helpers import bangun_langkah_terstruktur

ESC = "ESCAPE '\\'"

# Resep "polos" yang dianggap bukan hasil kombinasi bahan (aturan lama main.py dipertahankan).
POLA_NAMA_DIKECUALIKAN = ("%nasi goreng%", "%mie goreng%", "%bihun goreng%")


def _like(nilai):
    """'ayam' -> '%ayam%' dengan wildcard milik user di-escape."""
    aman = nilai.lower().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{aman}%"


def _placeholder_ids(ids, params, prefix="id"):
    keys = []
    for i, val in enumerate(ids):
        k = f"{prefix}{i}"
        params[k] = val
        keys.append(f":{k}")
    return ", ".join(keys)


# ---------------------------------------------------------------- helper lampiran

def _lampirkan_bahan(conn, resep_list):
    """Isi `bahan_terpakai` untuk tiap resep dengan 1 query (bukan join berlapis)."""
    if not resep_list:
        return
    params = {}
    marks = _placeholder_ids([r["id_resep"] for r in resep_list], params)
    rows = conn.execute(text(f"""
        SELECT rb.id_resep, b.nama_bahan, rb.takaran, rb.is_bumbu_dasar, b.is_alergen, b.is_pedas
        FROM {T_RESEP_BAHAN} rb
        JOIN {T_BAHAN} b ON b.id_bahan = rb.id_bahan
        WHERE rb.id_resep IN ({marks})
        ORDER BY rb.id_resep, rb.id_resep_bahan
    """), params).mappings().all()
    peta = {r["id_resep"]: r for r in resep_list}
    for row in rows:
        item = bahan_item(row)
        # Kartu daftar tetap memakai 3 field lama agar kompatibel dengan FE.
        peta[row["id_resep"]]["bahan_terpakai"].append(
            {k: item[k] for k in ("nama_bahan", "takaran", "is_bumbu_dasar")}
        )


def lampirkan_status_user(conn, resep_list, id_user):
    """Tambah flag sudah_like / sudah_simpan bila request membawa token valid."""
    if not resep_list:
        return
    if not id_user:
        for r in resep_list:
            r["sudah_like"] = False
            r["sudah_simpan"] = False
        return
    params = {"u": id_user}
    marks = _placeholder_ids([r["id_resep"] for r in resep_list], params)
    liked = {x[0] for x in conn.execute(text(
        f"SELECT id_resep FROM {T_LIKE} WHERE id_user = :u AND id_resep IN ({marks})"), params).all()}
    saved = {x[0] for x in conn.execute(text(
        f"SELECT id_resep FROM {T_SIMPAN} WHERE id_user = :u AND id_resep IN ({marks})"), params).all()}
    for r in resep_list:
        r["sudah_like"] = r["id_resep"] in liked
        r["sudah_simpan"] = r["id_resep"] in saved


def lampirkan_lengkap(conn, resep_list, id_user):
    _lampirkan_bahan(conn, resep_list)
    lampirkan_status_user(conn, resep_list, id_user)


def _meta_halaman(total, halaman):
    return {
        "total_ditemukan": total,
        "halaman": halaman,
        "total_halaman": (total + Settings.PAGE_SIZE - 1) // Settings.PAGE_SIZE,
    }


def _klausa_filter(pola_dikecualikan, params):
    """Resep yang mengandung bahan terlarang (alergi/pantangan) dibuang."""
    if not pola_dikecualikan:
        return ""
    kondisi = []
    for i, pola in enumerate(pola_dikecualikan):
        params[f"ex{i}"] = _like(pola)
        kondisi.append(f"LOWER(bf.nama_bahan) LIKE :ex{i} {ESC}")
    return f"""
        AND NOT EXISTS (
            SELECT 1 FROM {T_RESEP_BAHAN} rbf
            JOIN {T_BAHAN} bf ON bf.id_bahan = rbf.id_bahan
            WHERE rbf.id_resep = r.id_resep AND ({' OR '.join(kondisi)})
        )"""


# ---------------------------------------------------------------- daftar biasa

def _daftar_resep(where_sql, params, order_by, halaman, id_user):
    params = dict(params)
    params["limit"] = Settings.PAGE_SIZE
    params["offset"] = (halaman - 1) * Settings.PAGE_SIZE
    base = f"FROM {T_RESEP} r WHERE {where_sql}"
    with get_engine().connect() as conn:
        total = conn.execute(text(f"SELECT COUNT(*) {base}"), params).scalar_one()
        rows = conn.execute(text(f"""
            SELECT r.id_resep, r.nama_resep, r.jumlah_like, r.url {base}
            ORDER BY {order_by} LIMIT :limit OFFSET :offset
        """), params).mappings().all()
        data = [resep_ringkas(r) for r in rows]
        lampirkan_lengkap(conn, data, id_user)
    return {"data": data, **_meta_halaman(total, halaman)}


def resep_terpopuler(halaman, pola_filter, id_user=None):
    params = {}
    where = "1=1" + _klausa_filter(pola_filter, params)
    return _daftar_resep(where, params, "r.jumlah_like DESC, r.id_resep", halaman, id_user)


def cari_resep_nama(keyword, halaman, pola_filter, id_user=None):
    params = {"nama": _like(keyword)}
    where = f"LOWER(r.nama_resep) LIKE :nama {ESC}" + _klausa_filter(pola_filter, params)
    return _daftar_resep(where, params, "r.jumlah_like DESC, r.id_resep", halaman, id_user)


def cek_nama_resep(keyword):
    keyword = keyword.strip()
    if not keyword:
        return False
    with get_engine().connect() as conn:
        n = conn.execute(
            text(f'SELECT COUNT(*) FROM {T_RESEP} WHERE LOWER(nama_resep) LIKE :n {ESC}'),
            {"n": _like(keyword)},
        ).scalar_one()
    return n > 0


# ---------------------------------------------------------------- kombinasi bahan

MODIFIER_JARAK = ("kaldu", "rasa", "royco", "masako", "sajiku", "penyedap",
                 "bumbu", "instan", "bubuk", "saus", "kecap")
MODIFIER_DEKAT = ("telur", "telor", "minyak", "lemak")

MIN_JUDUL_UNTUK_CEK_MENU = 20
RASIO_MINIMAL_BAHAN = 0.3


def _esc(nilai):
    return nilai.lower().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _norm(kolom):
    ekspr = f"LOWER({kolom})"
    for ch in (",", ".", "(", ")", "/", "-", ":", ";"):
        ekspr = f"REPLACE({ekspr}, '{ch}', ' ')"
    return f"(' ' || {ekspr} || ' ')"


BN_CTE = f"bn AS MATERIALIZED (SELECT id_bahan, {_norm('nama_bahan')} AS n FROM {T_BAHAN})"


def _pola_kata(term):
    return f"% {_esc(term)}%"


def _modifier_params(term, params, prefix):
    kondisi = []
    for i, mod in enumerate(MODIFIER_JARAK):
        params[f"{prefix}j{i}"] = f"%{mod}%{_esc(term)}%"
        kondisi.append(f"{{N}} NOT LIKE :{prefix}j{i} {ESC}")
    for i, mod in enumerate(MODIFIER_DEKAT):
        params[f"{prefix}d{i}"] = f"%{mod} {_esc(term)}%"
        kondisi.append(f"{{N}} NOT LIKE :{prefix}d{i} {ESC}")
    return kondisi


@lru_cache(maxsize=1024)
def _statistik_istilah(term):
    params = {"u": _pola_kata(term)}
    kondisi = [f"bn.n LIKE :u {ESC}"] + [
        k.replace("{N}", "bn.n") for k in _modifier_params(term, params, "m")
    ]
    with get_engine().connect() as conn:
        pakai = conn.execute(text(f"""
            WITH {BN_CTE}
            SELECT COUNT(DISTINCT rb.id_resep) FROM {T_RESEP_BAHAN} rb
            JOIN bn ON bn.id_bahan = rb.id_bahan
            WHERE {' AND '.join(kondisi)}
        """), params).scalar_one()
        judul = conn.execute(text(
            f"SELECT COUNT(*) FROM {T_RESEP} WHERE (' ' || LOWER(nama_resep)) LIKE :u {ESC}"
        ), {"u": _pola_kata(term)}).scalar_one()
    return pakai, judul


def pastikan_bahan_utama_valid(bahan_utama):
    pakai, judul = _statistik_istilah(bahan_utama)
    if pakai == 0 and judul > 0:
        raise AppError(
            f"'{bahan_utama}' adalah nama menu, bukan bahan. Gunakan kolom 'Cari Resep Langsung'.",
            400, code="BAHAN_UTAMA_NAMA_MENU",
        )
    if pakai == 0:
        raise AppError(f"Bahan utama '{bahan_utama}' tidak dikenali.", 400, code="BAHAN_UTAMA_TIDAK_DIKENAL")
    if judul >= MIN_JUDUL_UNTUK_CEK_MENU and pakai / judul < RASIO_MINIMAL_BAHAN:
        raise AppError(
            f"'{bahan_utama}' adalah nama menu, bukan bahan. Gunakan kolom 'Cari Resep Langsung'.",
            400, code="BAHAN_UTAMA_NAMA_MENU",
        )


def _bahan_tidak_dikenal(conn, bahan_tambahan):
    if not bahan_tambahan:
        return []
    params, kolom = {}, []
    for i, bahan in enumerate(bahan_tambahan):
        params[f"t{i}"] = _pola_kata(bahan)
        kolom.append(f"MAX(CASE WHEN n LIKE :t{i} {ESC} THEN 1 ELSE 0 END)")
    row = conn.execute(text(f"WITH {BN_CTE} SELECT {', '.join(kolom)} FROM bn"), params).first()
    return [b for b, ada in zip(bahan_tambahan, row) if not ada]


def _label_tingkat(utama, cocok, total_tambahan):
    if total_tambahan == 0 or cocok == 0:
        return f"{utama} saja" if cocok == 0 else utama
    if cocok == total_tambahan:
        return f"{utama} + semua bahan tambahan"
    return f"{utama} + {cocok} dari {total_tambahan} bahan tambahan"


def cari_resep_kombinasi(bahan_utama, bahan_tambahan, halaman, pola_filter, id_user=None):
    pastikan_bahan_utama_valid(bahan_utama)

    n = len(bahan_tambahan)
    params = {"utama": _pola_kata(bahan_utama)}
    syarat_utama = [k.replace("{N}", "n") for k in _modifier_params(bahan_utama, params, "mu")]
    kondisi_utama = " AND ".join([f"n LIKE :utama {ESC}"] + syarat_utama)

    kolom_bm = [f"CASE WHEN {kondisi_utama} THEN 1 ELSE 0 END AS u"]
    flags, cocok_expr, prioritas_expr = [], [], []
    for i, bahan in enumerate(bahan_tambahan):
        params[f"t{i}"] = _pola_kata(bahan)
        kolom_bm.append(f"CASE WHEN n LIKE :t{i} {ESC} THEN 1 ELSE 0 END AS t{i}")
        flags.append(f"MAX(bm.t{i}) AS m{i}")
        cocok_expr.append(f"s.m{i}")
        prioritas_expr.append(f"s.m{i} * {2 ** (n - 1 - i)}")

    select_flags = (", " + ", ".join(flags)) if flags else ""
    select_m = (", " + ", ".join(f"s.m{i}" for i in range(n))) if n else ""
    jumlah_cocok = " + ".join(cocok_expr) if cocok_expr else "CAST(0 AS INTEGER)"
    prioritas = " + ".join(prioritas_expr) if prioritas_expr else "CAST(0 AS INTEGER)"

    params["judul"] = _pola_kata(bahan_utama)
    where = " AND ".join(f"LOWER(r.nama_resep) NOT LIKE :nx{i}" for i in range(len(POLA_NAMA_DIKECUALIKAN)))
    for i, pola in enumerate(POLA_NAMA_DIKECUALIKAN):
        params[f"nx{i}"] = pola
    where += _klausa_filter(pola_filter, params)

    cte = f"""
        WITH {BN_CTE},
        bm AS (
            SELECT id_bahan, {', '.join(kolom_bm)} FROM bn
        ),
        skor AS (
            SELECT rb.id_resep AS id_resep{select_flags}
            FROM {T_RESEP_BAHAN} rb
            JOIN bm ON bm.id_bahan = rb.id_bahan
            GROUP BY rb.id_resep
            HAVING MAX(bm.u) = 1
        )"""
    dari = f"FROM skor s JOIN {T_RESEP} r ON r.id_resep = s.id_resep WHERE {where}"
    judul_expr = f"CASE WHEN (' ' || LOWER(r.nama_resep)) LIKE :judul {ESC} THEN 1 ELSE 0 END"

    page_params = dict(params)
    page_params["limit"] = Settings.PAGE_SIZE
    page_params["offset"] = (halaman - 1) * Settings.PAGE_SIZE

    with get_engine().connect() as conn:
        ringkasan_rows = conn.execute(text(f"""
            {cte}
            SELECT ({jumlah_cocok}) AS jumlah_cocok, COUNT(*) AS total
            {dari} GROUP BY ({jumlah_cocok}) ORDER BY jumlah_cocok DESC
        """), params).mappings().all()

        rows = conn.execute(text(f"""
            {cte}
            SELECT r.id_resep, r.nama_resep, r.jumlah_like, r.url{select_m},
                   ({jumlah_cocok}) AS jumlah_cocok, ({prioritas}) AS prioritas,
                   {judul_expr} AS judul_utama
            {dari}
            ORDER BY jumlah_cocok DESC, judul_utama DESC, prioritas DESC, r.jumlah_like DESC, r.id_resep
            LIMIT :limit OFFSET :offset
        """), page_params).mappings().all()

        data = []
        for row in rows:
            item = resep_ringkas(row)
            cocok = [b for i, b in enumerate(bahan_tambahan) if row[f"m{i}"]]
            kurang = [b for i, b in enumerate(bahan_tambahan) if not row[f"m{i}"]]
            item["jumlah_cocok"] = row["jumlah_cocok"]
            item["bahan_cocok"] = [bahan_utama] + cocok
            item["bahan_kurang"] = kurang
            item["label_kombinasi"] = " + ".join([bahan_utama] + cocok)
            item["kombinasi_lengkap"] = len(kurang) == 0
            item["judul_memuat_bahan_utama"] = bool(row["judul_utama"])
            data.append(item)
        lampirkan_lengkap(conn, data, id_user)
        tidak_dikenal = _bahan_tidak_dikenal(conn, bahan_tambahan)

    total = sum(r["total"] for r in ringkasan_rows)
    return {
        "bahan_utama": bahan_utama,
        "bahan_tambahan": bahan_tambahan,
        "bahan_tambahan_tidak_dikenal": tidak_dikenal,
        "kombinasi": [
            {
                "jumlah_cocok": r["jumlah_cocok"],
                "total_resep": r["total"],
                "label": _label_tingkat(bahan_utama, r["jumlah_cocok"], n),
            }
            for r in ringkasan_rows
        ],
        "data": data,
        **_meta_halaman(total, halaman),
    }


# ---------------------------------------------------------------- detail & mode memasak

def _ambil_resep(conn, id_resep):
    row = conn.execute(text(
        f"SELECT id_resep, nama_resep, langkah, jumlah_like, url FROM {T_RESEP} WHERE id_resep = :i"
    ), {"i": id_resep}).mappings().first()
    if not row:
        raise AppError("Resep tidak ditemukan.", 404, code="RESEP_TIDAK_ADA")
    return row


def _ambil_bahan_lengkap(conn, id_resep):
    rows = conn.execute(text(f"""
        SELECT b.nama_bahan, rb.takaran, rb.is_bumbu_dasar, b.is_alergen, b.is_pedas
        FROM {T_RESEP_BAHAN} rb JOIN {T_BAHAN} b ON b.id_bahan = rb.id_bahan
        WHERE rb.id_resep = :i ORDER BY rb.id_resep_bahan
    """), {"i": id_resep}).mappings().all()
    return [bahan_item(r) for r in rows]


def detail_resep(id_resep, id_user=None):
    with get_engine().connect() as conn:
        row = _ambil_resep(conn, id_resep)
        bahan = _ambil_bahan_lengkap(conn, id_resep)
        langkah = bangun_langkah_terstruktur(row["langkah"])
        hasil = {
            "id_resep": row["id_resep"],
            "nama_resep": row["nama_resep"],
            "jumlah_like": row["jumlah_like"] or 0,
            "url": row["url"],
            "bahan": bahan,
            "bumbu_dasar": [b for b in bahan if b["is_bumbu_dasar"]],
            "langkah": langkah,
            "jumlah_langkah": len(langkah),
        }
        status = [hasil]
        lampirkan_status_user(conn, status, id_user)
    return hasil


def mode_memasak(id_resep):
    with get_engine().connect() as conn:
        row = _ambil_resep(conn, id_resep)
        bahan = _ambil_bahan_lengkap(conn, id_resep)
    langkah = bangun_langkah_terstruktur(row["langkah"])
    if not langkah:
        raise AppError("Resep ini belum memiliki langkah memasak.", 404, code="LANGKAH_KOSONG")
    return {
        "id_resep": row["id_resep"],
        "nama_resep": row["nama_resep"],
        "bahan": bahan,
        "total_langkah": len(langkah),
        "langkah": langkah,
    }