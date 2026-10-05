from flask import request, jsonify

def search_recipes_by_ingredients():
    # Ambil parameter dari URL, contoh: ?ingredients=ayam,cabe,tahu
    ingredients_param = request.args.get('ingredients', '')
    
    if not ingredients_param:
        return jsonify({
            "status": "error",
            "message": "Parameter ingredients tidak boleh kosong.",
            "data": []
        }), 400

    # Ubah string jadi list dan bersihkan spasi
    ingredients_list = [ing.strip().lower() for ing in ingredients_param.split(',')]
    
    # --- LOGIKA DATABASE ---
    # Masukkan query database kamu di sini untuk mencocokkan bahan.
    # Contoh hasil jika resep tidak ditemukan (sesuai desain UI-mu):
    recipes = [] 
    
    if not recipes:
        formatted_ingredients = ",".join(ingredients_list)
        return jsonify({
            "status": "success",
            "message": f'Tidak ditemukan resep untuk bahan "{formatted_ingredients}".',
            "data": []
        }), 200

    return jsonify({
        "status": "success",
        "message": "Resep berhasil ditemukan",
        "data": recipes
    }), 200