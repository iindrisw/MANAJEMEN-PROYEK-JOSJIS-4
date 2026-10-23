from flask import Flask
from flask_cors import CORS
# Import fungsi dari controller kita
from src.controllers.recipe_controller import (
    get_most_liked_recipes_controller,
    search_recipes_by_ingredients,
    search_recipes_by_name
)

app = Flask(__name__)
CORS(app)

# --- DAFTARKAN RUTE / ENDPOINT DI SINI ---
app.route('/api/most-liked', methods=['GET'])(get_most_liked_recipes_controller)
app.route('/api/search-bahan', methods=['GET'])(search_recipes_by_ingredients)
app.route('/api/recipes/search', methods=['GET'])(search_recipes_by_name)

if __name__ == '__main__':
    app.run(debug=True, port=5000)