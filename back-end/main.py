import os
from flask import Flask, jsonify, request
from flask_cors import CORS  
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load isi file .env dari folder back-end
load_dotenv()

app = Flask(__name__)
CORS(app)  

db_url = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres.wjthntdtgjeiirtjjkgd:josjissupabase@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres")
engine = create_engine(db_url)


# ================= 1. KAMUS SINONIM BAHAN =================
SYNONYM_MAP = {
    "telor": "telur",
    "cabe": "cabai",
    "rawit": "cabe rawit",
    "bamer": "bawang merah",
    "baput": "bawang putih"
}

def normalisasi_bahan(nama_bahan):
    nama_bersih = nama_bahan.strip().lower()
    return SYNONYM_MAP.get(nama_bersih, nama_bersih)


PAGE_SIZE = 6

RECIPE_FILTER_INGREDIENTS = {
    "egg": ("telur", "telor"),
    "seafood": (
        "seafood", "ikan", "udang", "ebi", "rebon", "cumi", "sotong",
        "gurita", "kepiting", "rajungan", "kerang", "tiram", "lobster",
    ),
    "nuts": (
        "kacang", "peanut", "almond", "mede", "mete", "kenari",
        "pistachio", "hazelnut", "walnut",
    ),
    "chili": ("cabai", "cabe", "chili", "chilli", "rawit", "lombok", "sambal"),
    "pepper": ("lada", "merica", "pepper"),
}


def apply_recipe_filters(where_clause, params):
    requested_filters = {
        value.strip()
        for value in request.args.get("filters", "").split(",")
        if value.strip()
    }
    unknown_filters = requested_filters - RECIPE_FILTER_INGREDIENTS.keys()
    if unknown_filters:
        raise ValueError("Pilihan filter resep tidak valid.")

    patterns = [
        pattern
        for filter_name in requested_filters
        for pattern in RECIPE_FILTER_INGREDIENTS[filter_name]
    ]
    if not patterns:
        return where_clause, params

    excluded_conditions = []
    filtered_params = dict(params)
    for index, pattern in enumerate(patterns):
        parameter_name = f"excluded_ingredient_{index}"
        excluded_conditions.append(f"LOWER(b_filter.nama_bahan) LIKE :{parameter_name}")
        filtered_params[parameter_name] = f"%{pattern}%"

    excluded_clause = " OR ".join(excluded_conditions)
    return (
        f"""({where_clause}) AND NOT EXISTS (
            SELECT 1
            FROM "Resep_bahan" rb_filter
            JOIN bahan b_filter ON rb_filter.id_bahan = b_filter.id_bahan
            WHERE rb_filter.id_resep = r.id_resep
              AND ({excluded_clause})
        )""",
        filtered_params,
    )


def format_resep(rows):
    resep_dict = {}
    for row in rows:
        id_resep = row[0]
        if id_resep not in resep_dict:
            resep_dict[id_resep] = {
                "id_resep": id_resep,
                "nama_resep": row[1],
                "jumlah_like": row[2],
                "url": row[3],
                "bahan_terpakai": []
            }
        if row[4] is not None:
            resep_dict[id_resep]["bahan_terpakai"].append({
                "nama_bahan": row[4],
                "takaran": row[5],
                "is_bumbu_dasar": row[6]
            })
    return list(resep_dict.values())


def ambil_halaman_resep(conn, where_clause, params, page):
    total = conn.execute(
        text(f'SELECT COUNT(*) FROM "Resep" r WHERE {where_clause}'),
        params
    ).scalar_one()
    page_params = {
        **params,
        "page_size": PAGE_SIZE,
        "offset": (page - 1) * PAGE_SIZE
    }
    query = text(f"""
        WITH resep_cocok AS (
            SELECT r.id_resep, r.nama_resep, r.jumlah_like, r.url
            FROM "Resep" r
            WHERE {where_clause}
        ),
        resep_halaman AS (
            SELECT *
            FROM resep_cocok
            ORDER BY jumlah_like DESC, id_resep
            LIMIT :page_size OFFSET :offset
        )
        SELECT p.id_resep, p.nama_resep, p.jumlah_like, p.url,
               b.nama_bahan, rb.takaran, rb.is_bumbu_dasar
        FROM resep_halaman p
        LEFT JOIN "Resep_bahan" rb ON p.id_resep = rb.id_resep
        LEFT JOIN bahan b ON rb.id_bahan = b.id_bahan
        ORDER BY p.jumlah_like DESC, p.id_resep;
    """)
    rows = conn.execute(query, page_params).fetchall()
    return {
        "data": format_resep(rows),
        "total_ditemukan": total,
        "halaman": page,
        "total_halaman": (total + PAGE_SIZE - 1) // PAGE_SIZE
    }


# ================= 2. ENDPOINT REKOMENDASI MOST LIKED (LANDING PAGE) =================
@app.route("/api/most-liked", methods=["GET"])
def get_most_liked_recipes():
    try:
        page = int(request.args.get("page", "1"))
    except ValueError:
        return jsonify({"status": "error", "message": "Nomor halaman tidak valid."}), 400

    if page < 1:
        return jsonify({
            "status": "error",
            "message": "Nomor halaman harus lebih besar dari 0."
        }), 400

    try:
        where_clause, params = apply_recipe_filters("TRUE", {})
    except ValueError as error:
        return jsonify({"status": "error", "message": str(error)}), 400

    try:
        with engine.connect() as conn:
            hasil = ambil_halaman_resep(conn, where_clause, params, page)

        return jsonify({
            "status": "success",
            **hasil,
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ================= 3. ENDPOINT PENCARIAN BERDASARKAN BAHAN =================
@app.route("/api/search-bahan", methods=["GET"])
def cari_resep_berdasarkan_bahan():
    raw_query = request.args.get("q", "").strip()
    try:
        page = int(request.args.get("page", "1"))
    except ValueError:
        return jsonify({"status": "error", "message": "Nomor halaman tidak valid."}), 400

    if page < 1:
        return jsonify({
            "status": "error",
            "message": "Nomor halaman harus lebih besar dari 0."
        }), 400

    if not raw_query:
        return jsonify({"status": "error", "message": "Kata kunci bahan tidak boleh kosong!"}), 400

    ingredients_list = [
        normalisasi_bahan(item) 
        for item in raw_query.split(",") 
        if item.strip()
    ]

    if not ingredients_list:
        return jsonify({"status": "error", "message": "Kata kunci bahan tidak valid!"}), 400

    conditions = []
    params = {}

    for i, ing in enumerate(ingredients_list):
        param_name = f"ing_{i}"
        conditions.append(f"""
            r.id_resep IN (
                SELECT rb_sub.id_resep 
                FROM "Resep_bahan" rb_sub
                JOIN bahan b_sub ON rb_sub.id_bahan = b_sub.id_bahan
                WHERE LOWER(b_sub.nama_bahan) LIKE :{param_name}
            )
        """)
        params[param_name] = f"%{ing}%"

    where_clause = " AND ".join(conditions)
    try:
        where_clause, params = apply_recipe_filters(where_clause, params)
    except ValueError as error:
        return jsonify({"status": "error", "message": str(error)}), 400

    try:
        with engine.connect() as conn:
            hasil = ambil_halaman_resep(conn, where_clause, params, page)

        return jsonify({
            "keyword_pencarian": raw_query,
            **hasil,
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ================= 4. ENDPOINT PENCARIAN BERDASARKAN RESEP =================
@app.route("/api/search-resep", methods=["GET"]) 
def cari_resep_berdasarkan_nama():
    raw_query = request.args.get("q", "").strip()
    try:
        page = int(request.args.get("page", "1"))
    except ValueError:
        return jsonify({"status": "error", "message": "Nomor halaman tidak valid."}), 400

    if page < 1:
        return jsonify({
            "status": "error",
            "message": "Nomor halaman harus lebih besar dari 0."
        }), 400
    if not raw_query:
        return jsonify({"status": "error", "message": "Kata kunci resep tidak boleh kosong."}), 400

    where_clause = "LOWER(r.nama_resep) LIKE :nama_resep"
    params = {"nama_resep": f"%{raw_query.lower()}%"}
    try:
        where_clause, params = apply_recipe_filters(where_clause, params)
    except ValueError as error:
        return jsonify({"status": "error", "message": str(error)}), 400

    try:
        with engine.connect() as conn:
            hasil = ambil_halaman_resep(
                conn,
                where_clause,
                params,
                page
            )

        return jsonify({
            "keyword_pencarian": raw_query,
            **hasil,
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)