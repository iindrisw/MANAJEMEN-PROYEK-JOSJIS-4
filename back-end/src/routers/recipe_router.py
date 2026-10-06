from flask import Blueprint
from src.controllers.recipe_controller import search_recipes_by_ingredients

recipe_bp = Blueprint('recipe_bp', __name__)

# Endpoint: /api/recipes/search
recipe_bp.route('/search', methods=['GET'])(search_recipes_by_ingredients)