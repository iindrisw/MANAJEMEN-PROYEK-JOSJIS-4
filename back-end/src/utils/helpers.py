"""Fungsi pembantu: format response JSON, parsing langkah masak, dll."""
import re

from flask import jsonify

LANGKAH_SEPARATOR = "--"
_DURASI_RE = re.compile(r"(\d+)\s*(menit|jam)", re.IGNORECASE)


def success_response(payload=None, status_code=200):
    body = {"status": "success"}
    if payload:
        body.update(payload)
    return jsonify(body), status_code


def error_response(message, status_code=400, code=None):
    body = {"status": "error", "message": message}
    if code:
        body["code"] = code
    return jsonify(body), status_code


def pisah_langkah(teks_langkah):
    """Pecah kolom `Resep.langkah` (dipisah '--') menjadi daftar langkah bersih."""
    if not teks_langkah:
        return []
    bagian = [b.strip() for b in teks_langkah.split(LANGKAH_SEPARATOR)]
    return [b for b in bagian if b]


def deteksi_durasi_menit(teks):
    """Ambil durasi pertama yang disebut di langkah (mis. '15 menit', '1 jam').

    Dipakai mode memasak supaya FE bisa menampilkan tombol timer. None bila tidak ada.
    """
    match = _DURASI_RE.search(teks or "")
    if not match:
        return None
    angka, satuan = int(match.group(1)), match.group(2).lower()
    return angka * 60 if satuan == "jam" else angka


def bangun_langkah_terstruktur(teks_langkah):
    langkah = pisah_langkah(teks_langkah)
    total = len(langkah)
    return [
        {
            "nomor": i,
            "total": total,
            "teks": teks,
            "timer_menit": deteksi_durasi_menit(teks),
            "is_pertama": i == 1,
            "is_terakhir": i == total,
        }
        for i, teks in enumerate(langkah, start=1)
    ]
