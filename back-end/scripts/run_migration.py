"""Terapkan file migrasi SQL.  Pakai: python scripts/run_migration.py migrations/001_auth_google_interaksi.sql"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text

from src.config.database import get_engine
from src.config.settings import Settings

if not Settings.DATABASE_URL:
    raise SystemExit("DATABASE_URL belum diisi di .env")

path = sys.argv[1] if len(sys.argv) > 1 else "migrations/001_auth_google_interaksi.sql"
with open(path, encoding="utf-8") as f:
    sql = f.read()

# Buang komentar baris penuh lalu pecah per statement.
bersih = "\n".join(l for l in sql.splitlines() if not l.strip().startswith("--"))
statements = [s.strip() for s in bersih.split(";") if s.strip()]

with get_engine().begin() as conn:
    for i, stmt in enumerate(statements, 1):
        conn.execute(text(stmt))
        print(f"[{i}/{len(statements)}] OK: {stmt.splitlines()[0][:70]}")
print("Migrasi selesai.")
