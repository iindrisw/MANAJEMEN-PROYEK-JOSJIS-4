"""Koneksi database (Supabase / PostgreSQL) via SQLAlchemy."""
from sqlalchemy import create_engine

from src.config.settings import Settings

_engine = None


def get_engine():
    """Engine dibuat sekali (lazy) lalu dipakai ulang oleh semua service."""
    global _engine
    if _engine is None:
        _engine = create_engine(
            Settings.DATABASE_URL,
            pool_pre_ping=True,  # buang koneksi mati dari pooler Supabase
            pool_recycle=300,
        )
    return _engine
