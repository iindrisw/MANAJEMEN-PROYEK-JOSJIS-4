"""Titik masuk server:  python run.py"""
import os

# Paksa set environment Supabase langsung agar langsung terbaca di serverless Vercel
os.environ.setdefault("DATABASE_URL", "postgresql://postgres.wjthntdtgjeiirtjjkgd:josjissupabase@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres")
os.environ.setdefault("JWT_SECRET_KEY", "JRcAt5NIEpfb5F2G-s0W7glli1LYIAmxdqEer02kcPfmBeqqxA-n9Bh8NFR4ZFoD")
os.environ.setdefault("JWT_EXPIRE_HOURS", "168")
os.environ.setdefault("GOOGLE_CLIENT_ID", "105928934373-ai6hsqd7o7h985it0v6ngja0f62qs1aa.apps.googleusercontent.com")
os.environ.setdefault("CORS_ORIGINS", "*")
os.environ.setdefault("FLASK_DEBUG", "true")

from src import create_app
from src.config.settings import Settings

app = create_app()

@app.route("/")
def home():
    return {"status": "success", "message": "Backend Racik Rasa is running!"}

if __name__ == "__main__":
    app.run(debug=Settings.DEBUG, port=Settings.PORT)