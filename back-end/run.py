"""Titik masuk server:  python run.py"""
from src import create_app
from src.config.settings import Settings

app = create_app()

if __name__ == "__main__":
    app.run(debug=Settings.DEBUG, port=Settings.PORT)
