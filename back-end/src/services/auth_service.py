"""Register, login email+password, dan login Google."""
import secrets

from sqlalchemy import text
from werkzeug.security import check_password_hash, generate_password_hash

from src.config.database import get_engine
from src.config.settings import Settings
from src.middlewares.auth_middleware import buat_token
from src.models.user_model import T_USER, user_publik
from src.utils.errors import AppError

_KOLOM = "id_user, nama, email, password, avatar_url, auth_provider"


def _cari_by_email(conn, email):
    return conn.execute(
        text(f"SELECT {_KOLOM} FROM {T_USER} WHERE LOWER(email) = :e"), {"e": email}
    ).mappings().first()


def _hasil_login(row):
    return {"token": buat_token(row["id_user"]), "user": user_publik(row)}


def register(nama, email, password):
    with get_engine().begin() as conn:
        if _cari_by_email(conn, email):
            raise AppError("Email sudah terdaftar.", 409, code="EMAIL_SUDAH_ADA")
        conn.execute(text(f"""
            INSERT INTO {T_USER} (nama, email, password, auth_provider)
            VALUES (:n, :e, :p, 'local')
        """), {"n": nama, "e": email, "p": generate_password_hash(password)})
        row = _cari_by_email(conn, email)
    return _hasil_login(row)


def login(email, password):
    with get_engine().connect() as conn:
        row = _cari_by_email(conn, email)
    # Pesan sama untuk email salah / password salah agar tidak membocorkan email terdaftar.
    salah = AppError("Email atau password salah.", 401, code="KREDENSIAL_SALAH")
    if not row:
        raise salah
    if not row["password"]:
        raise AppError(
            "Akun ini terdaftar lewat Google. Silakan masuk dengan Google.", 400,
            code="AKUN_GOOGLE",
        )
    if not check_password_hash(row["password"], password):
        raise salah
    return _hasil_login(row)


def _verifikasi_google(id_token_str):
    """Verifikasi id_token ke Google. Dipisah agar mudah di-mock saat testing."""
    if not Settings.GOOGLE_CLIENT_ID:
        raise AppError("Login Google belum dikonfigurasi di server.", 503, code="GOOGLE_NOT_CONFIGURED")
    try:
        from google.auth.transport import requests as g_requests
        from google.oauth2 import id_token as g_id_token

        return g_id_token.verify_oauth2_token(
            id_token_str, g_requests.Request(), Settings.GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise AppError("Token Google tidak valid atau kedaluwarsa.", 401, code="GOOGLE_TOKEN_INVALID")


def login_google(id_token_str):
    info = _verifikasi_google(id_token_str)
    if not info.get("email_verified"):
        raise AppError("Email Google belum terverifikasi.", 401, code="GOOGLE_EMAIL_UNVERIFIED")

    google_id = info["sub"]
    email = info["email"].strip().lower()
    nama = (info.get("name") or email.split("@")[0])[:100]
    avatar = info.get("picture")

    with get_engine().begin() as conn:
        row = conn.execute(
            text(f"SELECT {_KOLOM} FROM {T_USER} WHERE google_id = :g"), {"g": google_id}
        ).mappings().first()
        if not row:
            row = _cari_by_email(conn, email)
            if row:
                # Email sudah ada (daftar manual) -> tautkan ke akun Google yang sama.
                conn.execute(text(f"""
                    UPDATE {T_USER} SET google_id = :g, avatar_url = COALESCE(avatar_url, :a)
                    WHERE id_user = :i
                """), {"g": google_id, "a": avatar, "i": row["id_user"]})
            else:
                conn.execute(text(f"""
                    INSERT INTO {T_USER} (nama, email, password, google_id, avatar_url, auth_provider)
                    VALUES (:n, :e, NULL, :g, :a, 'google')
                """), {"n": nama, "e": email, "g": google_id, "a": avatar})
            row = _cari_by_email(conn, email)
    return _hasil_login(row)


def ambil_user(id_user):
    with get_engine().connect() as conn:
        row = conn.execute(
            text(f"SELECT {_KOLOM} FROM {T_USER} WHERE id_user = :i"), {"i": id_user}
        ).mappings().first()
    if not row:
        raise AppError("User tidak ditemukan.", 404, code="USER_TIDAK_ADA")
    return user_publik(row)
