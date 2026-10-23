"""Penanganan error global supaya route tidak perlu try/except berulang."""
import logging

from werkzeug.exceptions import HTTPException

from src.utils.errors import AppError
from src.utils.helpers import error_response

log = logging.getLogger(__name__)


def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(err):
        return error_response(err.message, err.status_code, err.code)

    @app.errorhandler(HTTPException)
    def handle_http_error(err):
        return error_response(err.description or err.name, err.code)

    @app.errorhandler(Exception)
    def handle_unexpected(err):
        log.exception("Error tak terduga")
        # Detail error sengaja tidak dikirim ke client (sebelumnya str(e) bocor ke response).
        return error_response("Terjadi kesalahan pada server.", 500)
