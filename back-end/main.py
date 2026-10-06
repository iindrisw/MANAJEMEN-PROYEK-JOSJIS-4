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
            "data": list_resep,
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ================= 3. ENDPOINT PENCARIAN BERDASARKAN BAHAN =================
@app.route("/api/search-bahan", methods=["GET"])
def cari_resep_berdasarkan_bahan():
    raw_query = request.args.get("q", "").strip()

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

    query = text(f"""
        SELECT r.id_resep, r.nama_resep, r.jumlah_like, r.url, b.nama_bahan, rb.takaran
        FROM "Resep" r
        JOIN "Resep_bahan" rb ON r.id_resep = rb.id_resep
        JOIN bahan b ON rb.id_bahan = b.id_bahan
        WHERE {where_clause}
        ORDER BY r.jumlah_like DESC;
    """)

    try:
        with engine.connect() as conn:
            result = conn.execute(query, params).fetchall()

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
            "keyword_pencarian": raw_query,
            "total_ditemukan": len(list_resep),
            "data": list_resep,
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)