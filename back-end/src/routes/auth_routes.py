"""Endpoint /api/auth/..."""
from flask import Blueprint, g, request

from src.middlewares.auth_middleware import login_required
from src.schemas.validation import validasi_google, validasi_login, validasi_register
from src.services import auth_service
from src.utils.helpers import success_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    nama, email, password = validasi_register(request.get_json(silent=True))
    return success_response(auth_service.register(nama, email, password), 201)


@auth_bp.post("/login")
def login():
    identifier, password = validasi_login(request.get_json(silent=True))
    return success_response(auth_service.login(identifier, password))


@auth_bp.post("/google")
def login_google():
    """FE kirim { "id_token": "<credential dari Google Identity Services>" }."""
    token = validasi_google(request.get_json(silent=True))
    return success_response(auth_service.login_google(token))


@auth_bp.get("/me")
@login_required
def me():
    return success_response({"user": auth_service.ambil_user(g.id_user)})


@auth_bp.put("/profile")
@login_required
def update_profile():
    """FE kirim { "nama": "Nama Baru" }."""
    data = request.get_json(silent=True) or {}
    nama_baru = data.get("nama")
    return success_response(auth_service.ubah_nama(g.id_user, nama_baru))


@auth_bp.post("/change-password")
@login_required
def change_password():
    """FE kirim { "password_lama": "...", "password_baru": "..." }."""
    data = request.get_json(silent=True) or {}
    password_lama = data.get("password_lama")
    password_baru = data.get("password_baru")
    return success_response(auth_service.ubah_password(g.id_user, password_lama, password_baru))


@auth_bp.post("/logout")
@login_required
def logout():
    """Endpoint logout untuk pengguna yang sedang terautentikasi."""
    return success_response({"message": "Berhasil keluar dari akun."})