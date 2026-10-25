"""Cek koneksi database.  Pakai: python scripts/check_db.py"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text

from src.config.database import get_engine
from src.config.settings import Settings

if not Settings.DATABASE_URL:
    raise SystemExit("DATABASE_URL belum diisi di .env")

try:
    with get_engine().connect() as conn:
        print("SUKSES!", conn.execute(text("SELECT version()")).scalar_one())
        print("Jumlah resep:", conn.execute(text('SELECT COUNT(*) FROM "Resep"')).scalar_one())
except Exception as err:
    raise SystemExit(f"GAGAL terhubung ke database: {err}")
