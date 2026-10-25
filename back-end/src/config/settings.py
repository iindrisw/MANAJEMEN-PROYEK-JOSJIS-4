"""Pengaturan aplikasi. Semua nilai rahasia dibaca dari environment (.env)."""
import os

from dotenv import load_dotenv

load_dotenv()


def _bool(value, default=False):
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    DEBUG = _bool(os.getenv("FLASK_DEBUG"), False)
    PORT = int(os.getenv("PORT", "5000"))

    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "168"))  # 7 hari

    # Login Google (Google Identity Services -> id_token)
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

    # CORS: pisahkan dengan koma, "*" = semua origin
    CORS_ORIGINS = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()
    ]

    # Aturan bisnis pencarian
    PAGE_SIZE = int(os.getenv("PAGE_SIZE", "6"))
    MAX_BAHAN_TAMBAHAN = 5


def validate_settings():
    """Dipanggil saat app dibuat supaya salah konfigurasi ketahuan di awal."""
    if not Settings.DATABASE_URL:
        raise RuntimeError("DATABASE_URL belum diisi di file .env")
    if not Settings.JWT_SECRET_KEY or len(Settings.JWT_SECRET_KEY) < 16:
        raise RuntimeError("JWT_SECRET_KEY belum diisi / terlalu pendek (min 16 karakter)")
