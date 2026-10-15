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
        resep_dict[id_resep]["bahan_terpakai"].append({
            "nama_bahan": row[4],
            "takaran": row[5]
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
               b.nama_bahan, rb.takaran
        FROM resep_halaman p
        JOIN "Resep_bahan" rb ON p.id_resep = rb.id_resep
        JOIN bahan b ON rb.id_bahan = b.id_bahan
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
            list_resep = format_resep(result)

        return jsonify({
            "status": "success",
            "total_ditemukan": len(list_resep),
            "data": list_resep,
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
        with engine.connect() as conn:
            hasil = ambil_halaman_resep(conn, where_clause, params, page)

        return jsonify({
            "keyword_pencarian": raw_query,
            **hasil,
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


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

    try:
        with engine.connect() as conn:
            hasil = ambil_halaman_resep(
                conn,
                "LOWER(r.nama_resep) LIKE :nama_resep",
                {"nama_resep": f"%{raw_query.lower()}%"},
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