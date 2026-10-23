from flask import jsonify, request
from sqlalchemy import text
from src.config.database import engine

# Kamus Sinonim Bahan
SYNONYM_MAP = {
    "telor": "telur", "telor ayam": "telur", "telor bebek": "telur",
    "cabe": "cabai", "rawit": "cabai", "cabe rawit": "cabai", 
    "bamer": "bawang merah", "baput": "bawang putih",
    "mi": "mie", "mie instan": "mie", "saos": "saus sambal"
}

def normalisasi_bahan(nama_bahan):
    nama_bersih = nama_bahan.strip().lower()
    return SYNONYM_MAP.get(nama_bersih, nama_bersih)

# 1. Controller untuk Resep Paling Disukai (Landing Page)
def get_most_liked_recipes_controller():
    query = text("""
        SELECT r.id_resep, r.nama_resep, r.jumlah_like, r.url, b.nama_bahan, rb.takaran
        FROM "Resep" r
        JOIN "Resep_bahan" rb ON r.id_resep = rb.id_resep
        JOIN bahan b ON rb.id_bahan = b.id_bahan
        WHERE r.id_resep IN (
            SELECT id_resep FROM "Resep"
            ORDER BY jumlah_like DESC
            LIMIT 6
        )
        ORDER BY r.jumlah_like DESC;
    """)

    try:
        with engine.connect() as conn:
            result = conn.execute(query).fetchall()

            resep_dict = {}
            for row in result:
                id_resep = row[0]
                if id_resep not in resep_dict:
                    resep_dict[id_resep] = {
                        "id_resep": id_resep,
                        "nama_resep": row[1],
                        "jumlah_like": row[2],
                        "url": row[3],
                        "bahan_terpakai": []
                    }
                resep_dict[id_resep]["bahan_terpakai"].append({
                    "nama_bahan": row[4],
                    "takaran": row[5]
                })

            list_resep = list(resep_dict.values())

        return jsonify({
            "status": "success",
            "total_ditemukan": len(list_resep),
            "total_halaman": 1,
            "data": list_resep,
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# 2. Controller Pencarian Berdasarkan Bahan (Dengan Validasi Ketat & Anti-Kecolongan Kata)
def search_recipes_by_ingredients():
    raw_query = request.args.get('q', '') or request.args.get('main_ingredient', '') or request.args.get('ingredients', '')

    if not raw_query:
        return jsonify({
            "status": "error",
            "message": "Parameter bahan tidak boleh kosong.",
            "data": []
        }), 400

    # BLOKIR: Mencegah nama menu atau kalimat panjang lolos di kolom bahan utama
    lower_query = raw_query.lower()
    menu_terlarang = ["nasi goreng", "mie ayam", "soto", "bakso", "sate", "rendang", "bubur", "ayam goreng"]
    
    if any(menu in lower_query for menu in menu_terlarang) or (len(raw_query.strip().split()) > 2 and ',' not in raw_query):
        return jsonify({
            "status": "success",
            "message": "Kolom Bahan Utama khusus bahan mentah. Gunakan pencarian resep langsung untuk nama menu.",
            "data": []
        }), 200

    ingredients_list = [
        normalisasi_bahan(ing) 
        for ing in raw_query.split(',') 
        if ing.strip()
    ]

    if not ingredients_list:
        return jsonify({
            "status": "error",
            "message": "Parameter bahan tidak valid.",
            "data": []
        }), 400

    bahan_utama = ingredients_list[0]
    list_tambahan = ingredients_list[1:]

    # Mengambil kandidat data dari database secara fleksibel, lalu disaring ketat di Python
    query = text("""
        SELECT DISTINCT r.id_resep, r.nama_resep, r.jumlah_like, r.url
        FROM "Resep" r
        JOIN "Resep_bahan" rb ON r.id_resep = rb.id_resep
        JOIN bahan b ON rb.id_bahan = b.id_bahan
        WHERE r.id_resep IN (
            SELECT rb_sub.id_resep 
            FROM "Resep_bahan" rb_sub
            JOIN bahan b_sub ON rb_sub.id_bahan = b_sub.id_bahan
            WHERE LOWER(b_sub.nama_bahan) LIKE :utama_pattern
        )
        ORDER BY r.jumlah_like DESC;
    """)

    try:
        with engine.connect() as conn:
            result = conn.execute(query, {
                "utama_pattern": f"%{bahan_utama}%"
            }).fetchall()

            resep_raw = {}
            for row in result:
                id_resep = row[0]
                if id_resep not in resep_raw:
                    resep_raw[id_resep] = {
                        "id_resep": id_resep,
                        "nama_resep": row[1],
                        "jumlah_like": row[2],
                        "url": row[3]
                    }

            recipes = []
            for id_resep, info in resep_raw.items():
                detail_query = text("""
                    SELECT b.nama_bahan, rb.takaran
                    FROM "Resep_bahan" rb
                    JOIN bahan b ON rb.id_bahan = b.id_bahan
                    WHERE rb.id_resep = :id_rsp
                """)
                bahan_rows = conn.execute(detail_query, {"id_rsp": id_resep}).fetchall()
                
                bahan_terpakai = []
                punya_bahan_utama_murni = False

                for b_row in bahan_rows:
                    nama_b = b_row[0].strip().lower()
                    takaran_b = b_row[1]
                    
                    bahan_terpakai.append({
                        "nama_bahan": b_row[0],
                        "takaran": takaran_b
                    })

                    # Validasi ketat level Python: Mencegah kecolongan substring di dalam kata lain (misal: "pastikan")
                    if nama_b == bahan_utama or nama_b.startswith(f"{bahan_utama} ") or nama_b.endswith(f" {bahan_utama}") or f" {bahan_utama} " in nama_b:
                        punya_bahan_utama_murni = True

                # Jika ternyata hanya nyempil di dalam kata lain, abaikan resep ini
                if not punya_bahan_utama_murni:
                    continue

                # Hitung skor kecocokan bahan tambahan
                skor_cocok = 0
                daftar_nama_bahan = [b["nama_bahan"].lower() for b in bahan_terpakai]
                if list_tambahan:
                    for tambahan in list_tambahan:
                        if any(tambahan in b_nama for b_nama in daftar_nama_bahan):
                            skor_cocok += 1

                recipes.append({
                    "id_resep": id_resep,
                    "nama_resep": info["nama_resep"],
                    "jumlah_like": info["jumlah_like"],
                    "url": info["url"],
                    "bahan_terpakai": bahan_terpakai,
                    "skor_kecocokan": skor_cocok
                })

            recipes.sort(key=lambda x: (x["skor_kecocokan"], x["jumlah_like"]), reverse=True)

        if not recipes:
            formatted_ingredients = ",".join(ingredients_list)
            return jsonify({
                "status": "success",
                "message": f'Tidak ditemukan resep untuk bahan "{formatted_ingredients}".',
                "total_halaman": 1,
                "data": []
            }), 200

        return jsonify({
            "status": "success",
            "message": "Resep berhasil ditemukan",
            "total_halaman": 1,
            "data": recipes
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e),
            "data": []
        }), 500

# 3. Controller Pencarian Berdasarkan Nama Menu / Keyword (Berkiblat langsung ke tabel Resep)
def search_recipes_by_name():
    keyword = request.args.get('keyword', '') or request.args.get('q', '')
    keyword = keyword.strip()

    if not keyword:
        return jsonify({
            "status": "error",
            "message": "Parameter keyword tidak boleh kosong.",
            "data": []
        }), 400

    query = text("""
        SELECT id_resep, nama_resep, jumlah_like, url
        FROM "Resep"
        WHERE LOWER(nama_resep) LIKE :kw
        ORDER BY jumlah_like DESC;
    """)

    try:
        with engine.connect() as conn:
            result = conn.execute(query, {"kw": f"%{keyword.lower()}%"}).fetchall()

            recipes = []
            for row in result:
                id_resep = row[0]
                
                detail_query = text("""
                    SELECT b.nama_bahan, rb.takaran
                    FROM "Resep_bahan" rb
                    JOIN bahan b ON rb.id_bahan = b.id_bahan
                    WHERE rb.id_resep = :id_rsp
                """)
                bahan_rows = conn.execute(detail_query, {"id_rsp": id_resep}).fetchall()
                
                bahan_terpakai = [
                    {"nama_bahan": b[0], "takaran": b[1]} for b in bahan_rows
                ]

                recipes.append({
                    "id_resep": id_resep,
                    "nama_resep": row[1],
                    "jumlah_like": row[2],
                    "url": row[3],
                    "bahan_terpakai": bahan_terpakai
                })

        if not recipes:
            return jsonify({
                "status": "success",
                "message": f'Tidak ditemukan resep dengan nama "{keyword}".',
                "total_halaman": 1,
                "data": []
            }), 200

        return jsonify({
            "status": "success",
            "message": "Pencarian resep berhasil",
            "total_halaman": 1,
            "data": recipes
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e),
            "data": []
        }), 500