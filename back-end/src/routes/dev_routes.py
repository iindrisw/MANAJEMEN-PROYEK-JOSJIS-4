"""Halaman uji manual (hanya didaftarkan saat FLASK_DEBUG=true)."""
import os

from flask import Blueprint, send_file

dev_bp = Blueprint("dev", __name__)
_HTML = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dev", "dev_console.html")


@dev_bp.get("/dev")
def console():
    return send_file(_HTML, mimetype="text/html")
