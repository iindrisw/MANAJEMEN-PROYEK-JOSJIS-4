"""Endpoint /api/users/me/... (daftar like & bookmark milik user yang login)."""
from flask import Blueprint, g, request

from src.middlewares.auth_middleware import login_required
from src.schemas.validation import validasi_halaman
from src.services import interaction_service
from src.utils.helpers import success_response

user_bp = Blueprint("users", __name__, url_prefix="/api/users/me")


@user_bp.get("/likes")
@login_required
def my_likes():
    return success_response(
        interaction_service.daftar_like(g.id_user, validasi_halaman(request.args.get("page")))
    )


@user_bp.get("/bookmarks")
@login_required
def my_bookmarks():
    return success_response(
        interaction_service.daftar_simpan(g.id_user, validasi_halaman(request.args.get("page")))
    )
