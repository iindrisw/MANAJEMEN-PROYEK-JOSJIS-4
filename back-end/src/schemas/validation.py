"""Aturan validasi input user. Semua fungsi mengembalikan nilai bersih atau raise AppError(400)."""
import re

from src.config.settings import Settings
from src.utils.errors import AppError

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD = 8

SYNONYM_MAP = {
    "telor": "telur",
    "cabe": "cabai",
    "rawit": "cabe rawit",
    "bamer": "bawang merah",
    "baput": "bawang putih",
}

RECIPE_FILTER_INGREDIENTS = {
    "egg": ("telur", "telor"),
    "seafood": (
        "seafood", "ikan", "udang", "ebi", "rebon", "cumi", "sotong",
        "gurita", "kepiting", "rajungan", "kerang", "tiram", "lobster",
    ),
    "nuts": (
        "kacang", "peanut", "almond", "mede", "mete", "kenari",
        "pistachio", "hazelnut", "walnut",
    ),
    "chili": ("cabai", "cabe", "chili", "chilli", "rawit", "lombok", "sambal"),
    "pepper": ("lada", "merica", "pepper"),
}


def normalisasi_bahan(nama):
    bersih = " ".join(nama.strip().lower().split())
    return SYNONYM_MAP.get(bersih, bersih)


def validasi_halaman(nilai):
    try:
        halaman = int(nilai or "1")
    except (TypeError, ValueError):
        raise AppError("Nomor halaman tidak valid.", 400)
    if halaman < 1:
        raise AppError("Nomor halaman harus lebih besar dari 0.", 400)
    return halaman


def validasi_filter(nilai):
    """'egg,nuts' -> daftar pola bahan yang harus dikecualikan."""
    diminta = {v.strip() for v in (nilai or "").split(",") if v.strip()}
    tidak_dikenal = diminta - RECIPE_FILTER_INGREDIENTS.keys()
    if tidak_dikenal:
        raise AppError("Pilihan filter resep tidak valid.", 400)
    return [p for nama in sorted(diminta) for p in RECIPE_FILTER_INGREDIENTS[nama]]


MAX_PANJANG_BAHAN = 50
HURUF_RE = re.compile(r"[a-zA-Z]{2}")  # minimal 2 huruf berurutan


def _cek_panjang(bahan):
    if len(bahan) > MAX_PANJANG_BAHAN:
        raise AppError(f"Nama bahan maksimal {MAX_PANJANG_BAHAN} karakter.", 400, code="BAHAN_TERLALU_PANJANG")
    if not HURUF_RE.search(bahan):
        raise AppError(f"Nama bahan '{bahan}' tidak valid.", 400, code="BAHAN_TIDAK_VALID")


def _cek_jumlah_tambahan(segmen_mentah):
    """Hitung segmen apa adanya (termasuk yang kosong) supaya koma ke-6 langsung ditolak.

    'a,b,c,d,e'  -> 5 segmen  -> boleh
    'a,b,c,d,e,' -> 6 segmen  -> ditolak (user menekan koma lagi padahal sudah 5)
    'a,b,'       -> 3 segmen  -> boleh (user masih mengetik bahan berikutnya)
    """
    if len(segmen_mentah) > Settings.MAX_BAHAN_TAMBAHAN:
        raise AppError(
            f"Bahan tambahan maksimal {Settings.MAX_BAHAN_TAMBAHAN}.", 400,
            code="BAHAN_TAMBAHAN_TERLALU_BANYAK",
        )


def validasi_pencarian_bahan(q, utama, tambahan):
    """Aturan input pencarian kombinasi.

    - Bahan utama WAJIB tepat 1 dan TIDAK BOLEH mengandung koma (koma = mau menambah bahan).
    - Bahan tambahan maksimal Settings.MAX_BAHAN_TAMBAHAN (5); koma ke-6 langsung ditolak.
    Dua cara kirim:
      * `utama=ayam&tambahan=kacang,bawang`  (disarankan; aturan koma di kolom utama berlaku penuh)
      * `q=ayam,kacang,bawang`  (format lama: item pertama = bahan utama)
    Mengembalikan (bahan_utama, [bahan_tambahan]) yang sudah dinormalisasi & tanpa duplikat.
    """
    if utama is not None and utama.strip():
        if "," in utama:
            raise AppError(
                "Bahan utama hanya boleh 1 bahan (tidak boleh pakai koma). "
                "Bahan lain masukkan ke kolom bahan tambahan.", 400, code="BAHAN_UTAMA_LEBIH_DARI_SATU",
            )
        bahan_utama = normalisasi_bahan(utama)
        segmen = (tambahan or "").split(",") if (tambahan or "").strip() else []
    else:
        segmen_q = (q or "").split(",") if (q or "").strip() else []
        if not segmen_q or not segmen_q[0].strip():
            raise AppError("Bahan utama tidak boleh kosong!", 400, code="BAHAN_UTAMA_KOSONG")
        bahan_utama = normalisasi_bahan(segmen_q[0])
        segmen = segmen_q[1:]

    if not bahan_utama:
        raise AppError("Bahan utama tidak boleh kosong!", 400, code="BAHAN_UTAMA_KOSONG")
    _cek_panjang(bahan_utama)
    _cek_jumlah_tambahan(segmen)

    daftar_tambahan = []
    for item in segmen:
        bahan = normalisasi_bahan(item)
        if not bahan:
            continue
        _cek_panjang(bahan)
        if bahan != bahan_utama and bahan not in daftar_tambahan:
            daftar_tambahan.append(bahan)
    return bahan_utama, daftar_tambahan


def validasi_keyword(q, pesan="Kata kunci tidak boleh kosong."):
    q = (q or "").strip()
    if not q:
        raise AppError(pesan, 400)
    return q


def validasi_register(data):
    data = data or {}
    nama = (data.get("nama") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not nama:
        raise AppError("Nama wajib diisi.", 400)
    if len(nama) > 100:
        raise AppError("Nama maksimal 100 karakter.", 400)
    if not EMAIL_RE.match(email) or len(email) > 100:
        raise AppError("Format email tidak valid.", 400)
    if len(password) < MIN_PASSWORD:
        raise AppError(f"Password minimal {MIN_PASSWORD} karakter.", 400)
    return nama, email, password


def validasi_login(data):
    data = data or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        raise AppError("Email dan password wajib diisi.", 400)
    return email, password


def validasi_google(data):
    token = ((data or {}).get("id_token") or (data or {}).get("credential") or "").strip()
    if not token:
        raise AppError("id_token Google wajib dikirim.", 400)
    return token
