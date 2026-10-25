"""Endpoint /api/recipes/... , pencarian, dan route lama (kompatibel dengan FE yang sudah ada)."""
from flask import Blueprint, g, request

from src.middlewares.auth_middleware import login_required, optional_auth
from src.schemas.validation import (
    validasi_filter, validasi_halaman, validasi_keyword, validasi_pencarian_bahan,
)
from src.services import interaction_service, recipe_service
from src.utils.helpers import success_response

recipe_bp = Blueprint("recipes", __name__, url_prefix="/api/recipes")
legacy_bp = Blueprint("legacy", __name__, url_prefix="/api")  # path lama yang dipakai FE


# ---------- handler bersama (dipakai route baru & route lama) ----------

def _terpopuler():
    hasil = recipe_service.resep_terpopuler(
        validasi_halaman(request.args.get("page")),
        validasi_filter(request.args.get("filters")),
        g.id_user,
    )
    return success_response(hasil)


def _cari_bahan():
    utama, tambahan = validasi_pencarian_bahan(
        request.args.get("q"), request.args.get("utama"), request.args.get("tambahan")
    )
    hasil = recipe_service.cari_resep_kombinasi(
        utama, tambahan,
        validasi_halaman(request.args.get("page")),
        validasi_filter(request.args.get("filters")),
        g.id_user,
    )
    hasil["keyword_pencarian"] = ",".join([utama] + tambahan)
    return success_response(hasil)


def _cari_nama():
    keyword = validasi_keyword(request.args.get("q"), "Kata kunci resep tidak boleh kosong.")
    hasil = recipe_service.cari_resep_nama(
        keyword,
        validasi_halaman(request.args.get("page")),
        validasi_filter(request.args.get("filters")),
        g.id_user,
    )
    hasil["keyword_pencarian"] = keyword
    return success_response(hasil)


def _cek_nama():
    ada = recipe_service.cek_nama_resep(request.args.get("q", ""))
    return success_response({"exists": ada})


# ---------- route baru: /api/recipes/... ----------

recipe_bp.get("/most-liked")(optional_auth(_terpopuler))
recipe_bp.get("/search")(optional_auth(_cari_bahan))          # ?utama=ayam&tambahan=kacang,bawang
recipe_bp.get("/search-name")(optional_auth(_cari_nama))
recipe_bp.get("/check-name")(_cek_nama)


@recipe_bp.get("/<int:id_resep>")
@optional_auth
def detail(id_resep):
    return success_response({"data": recipe_service.detail_resep(id_resep, g.id_user)})


@recipe_bp.get("/<int:id_resep>/cooking-mode")
def cooking_mode(id_resep):
    return success_response({"data": recipe_service.mode_memasak(id_resep)})


@recipe_bp.post("/<int:id_resep>/like")
@login_required
def like(id_resep):
    return success_response(interaction_service.like(g.id_user, id_resep))


@recipe_bp.delete("/<int:id_resep>/like")
@login_required
def unlike(id_resep):
    return success_response(interaction_service.unlike(g.id_user, id_resep))


@recipe_bp.post("/<int:id_resep>/bookmark")
@login_required
def bookmark(id_resep):
    return success_response(interaction_service.simpan(g.id_user, id_resep))


@recipe_bp.delete("/<int:id_resep>/bookmark")
@login_required
def unbookmark(id_resep):
    return success_response(interaction_service.hapus_simpan(g.id_user, id_resep))


# ---------- route lama (nama & format respons dipertahankan) ----------

legacy_bp.get("/most-liked")(optional_auth(_terpopuler))
legacy_bp.get("/search-bahan")(optional_auth(_cari_bahan))
legacy_bp.get("/search-resep")(optional_auth(_cari_nama))
legacy_bp.get("/cek-nama-resep")(_cek_nama)
