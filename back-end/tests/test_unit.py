"""Tes murni (tanpa database):  python -m unittest discover tests"""
import os
import unittest

os.environ.setdefault("JWT_SECRET_KEY", "x" * 40)

from src.schemas.validation import (  # noqa: E402
    validasi_filter, validasi_pencarian_bahan, validasi_register,
)
from src.utils.errors import AppError  # noqa: E402
from src.utils.helpers import bangun_langkah_terstruktur, deteksi_durasi_menit, pisah_langkah  # noqa: E402


class TestPencarian(unittest.TestCase):
    def test_format_baru(self):
        self.assertEqual(
            validasi_pencarian_bahan(None, "Ayam", "kacang, bawang"), ("ayam", ["kacang", "bawang"])
        )

    def test_format_lama_q(self):
        self.assertEqual(validasi_pencarian_bahan("ayam,telor", None, None), ("ayam", ["telur"]))

    def test_utama_harus_satu(self):
        with self.assertRaises(AppError):
            validasi_pencarian_bahan(None, "ayam,ikan", None)

    def test_tambahan_maks_5(self):
        enam = "kacang,bawang,kecap,tahu,tempe,cabai"
        with self.assertRaises(AppError):
            validasi_pencarian_bahan(None, "ayam", enam)
        self.assertEqual(len(validasi_pencarian_bahan(None, "ayam", "kacang,bawang,kecap,tahu,tempe")[1]), 5)

    def test_koma_ke_6_langsung_ditolak(self):
        with self.assertRaises(AppError) as ctx:
            validasi_pencarian_bahan(None, "ayam", "kacang,bawang,kecap,tahu,tempe,")
        self.assertEqual(ctx.exception.code, "BAHAN_TAMBAHAN_TERLALU_BANYAK")
        # 4 bahan + koma = masih mengetik bahan ke-5 -> boleh
        self.assertEqual(len(validasi_pencarian_bahan(None, "ayam", "kacang,bawang,kecap,tahu,")[1]), 4)

    def test_koma_di_bahan_utama_ditolak(self):
        for utama in ("ayam,", "ayam,ikan", ",ayam"):
            with self.assertRaises(AppError) as ctx:
                validasi_pencarian_bahan(None, utama, None)
            self.assertEqual(ctx.exception.code, "BAHAN_UTAMA_LEBIH_DARI_SATU")

    def test_input_tanpa_huruf_ditolak(self):
        for bad in ("%", "12", "--"):
            with self.assertRaises(AppError):
                validasi_pencarian_bahan(None, bad, None)

    def test_utama_kosong(self):
        with self.assertRaises(AppError):
            validasi_pencarian_bahan("", None, None)

    def test_duplikat_dibuang(self):
        self.assertEqual(validasi_pencarian_bahan(None, "ayam", "ayam,tahu,tahu")[1], ["tahu"])


class TestLainnya(unittest.TestCase):
    def test_filter(self):
        self.assertIn("kacang", validasi_filter("nuts"))
        with self.assertRaises(AppError):
            validasi_filter("xyz")

    def test_register(self):
        self.assertEqual(validasi_register({"nama": "A", "email": "A@B.co", "password": "12345678"})[1], "a@b.co")
        with self.assertRaises(AppError):
            validasi_register({"nama": "A", "email": "salah", "password": "12345678"})

    def test_langkah(self):
        self.assertEqual(pisah_langkah("a-- b --  --c--"), ["a", "b", "c"])
        langkah = bangun_langkah_terstruktur("Rebus 15 menit--Sajikan")
        self.assertEqual([l["nomor"] for l in langkah], [1, 2])
        self.assertTrue(langkah[0]["is_pertama"] and langkah[1]["is_terakhir"])
        self.assertEqual(langkah[0]["timer_menit"], 15)
        self.assertEqual(deteksi_durasi_menit("presto 1 jam"), 60)


if __name__ == "__main__":
    unittest.main()
