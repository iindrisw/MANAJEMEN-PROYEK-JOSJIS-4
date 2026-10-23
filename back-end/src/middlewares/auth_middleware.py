"""Pengecekan token JWT (Authorization: Bearer <token>)."""
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import g, request

from src.config.settings import Settings
from src.utils.errors import AppError


def buat_token(id_user):
    sekarang = datetime.now(timezone.utc)
    payload = {
        "sub": str(id_user),
        "iat": sekarang,
        "exp": sekarang + timedelta(hours=Settings.JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, Settings.JWT_SECRET_KEY, algorithm=Settings.JWT_ALGORITHM)


def _ambil_id_user_dari_header():
    """None bila tidak ada header; raise AppError(401) bila token ada tapi rusak/kedaluwarsa."""
    header = request.headers.get("Authorization", "")
    if not header:
        return None
    bagian = header.split()
    if len(bagian) != 2 or bagian[0].lower() != "bearer":
        raise AppError("Format Authorization harus 'Bearer <token>'.", 401, code="TOKEN_FORMAT")
    try:
        payload = jwt.decode(bagian[1], Settings.JWT_SECRET_KEY, algorithms=[Settings.JWT_ALGORITHM])
        return int(payload["sub"])
    except jwt.ExpiredSignatureError:
        raise AppError("Sesi login sudah berakhir, silakan login lagi.", 401, code="TOKEN_EXPIRED")
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise AppError("Token tidak valid.", 401, code="TOKEN_INVALID")


def login_required(fn):
    """Endpoint wajib login. id user tersedia di `g.id_user`."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        id_user = _ambil_id_user_dari_header()
        if id_user is None:
            raise AppError("Silakan login terlebih dahulu.", 401, code="LOGIN_REQUIRED")
        g.id_user = id_user
        return fn(*args, **kwargs)
    return wrapper


def optional_auth(fn):
    """Boleh anonim; kalau token dikirim maka `g.id_user` terisi (untuk flag sudah_like dll)."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        g.id_user = _ambil_id_user_dari_header()
        return fn(*args, **kwargs)
    return wrapper
