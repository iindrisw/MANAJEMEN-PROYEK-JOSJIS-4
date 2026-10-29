"""Application factory Flask."""
from flask import Flask
from flask_cors import CORS

from src.config.settings import Settings, validate_settings
from src.middlewares.error_handler import register_error_handlers
from src.routes.auth_routes import auth_bp
from src.routes.recipe_routes import legacy_bp, recipe_bp
from src.routes.user_routes import user_bp


def create_app():
    validate_settings()
    app = Flask(__name__)
    app.json.ensure_ascii = False  # biar karakter Indonesia/emoji tidak jadi \uXXXX
    CORS(app, origins=Settings.CORS_ORIGINS)  # Authorization header ikut diizinkan secara default

    register_error_handlers(app)
    for bp in (auth_bp, recipe_bp, user_bp, legacy_bp):
        app.register_blueprint(bp)

    if Settings.DEBUG:  # halaman uji manual, tidak ikut aktif di production
        from src.routes.dev_routes import dev_bp
        app.register_blueprint(dev_bp)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app
