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
    email, password = validasi_login(request.get_json(silent=True))
    return success_response(auth_service.login(email, password))


@auth_bp.post("/google")
def login_google():
    """FE kirim { "id_token": "<credential dari Google Identity Services>" }."""
    token = validasi_google(request.get_json(silent=True))
    return success_response(auth_service.login_google(token))


@auth_bp.get("/me")
@login_required
def me():
    return success_response({"user": auth_service.ambil_user(g.id_user)})
