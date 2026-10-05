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


@app.route("/api/search-bahan", methods=["GET"])
def cari_resep_berdasarkan_bahan():
    keyword = request.args.get("q", "").strip().lower()

    if not keyword:
        return jsonify({"status": "error", "message": "Kata kunci bahan tidak boleh kosong!"}), 400

    # LIMIT 6 di subquery dihapus agar pencarian benar-benar akurat sesuai bahan yang diketik
    query = text("""
        SELECT r.id_resep, r.nama_resep, r.jumlah_like, r.url, b.nama_bahan, rb.takaran
        FROM "Resep" r
        JOIN "Resep_bahan" rb ON r.id_resep = rb.id_resep
        JOIN bahan b ON rb.id_bahan = b.id_bahan
        WHERE r.id_resep IN (
            SELECT DISTINCT r2.id_resep 
            FROM "Resep" r2
            JOIN "Resep_bahan" rb2 ON r2.id_resep = rb2.id_resep
            JOIN bahan b2 ON rb2.id_bahan = b2.id_bahan
            WHERE LOWER(b2.nama_bahan) LIKE :keyword
        )
        ORDER BY r.jumlah_like DESC;
    """)

    try:
        with engine.connect() as conn:
            result = conn.execute(query, {"keyword": f"%{keyword}%"}).fetchall()

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
            "keyword_pencarian": keyword,
            "total_ditemukan": len(list_resep),
            "data": list_resep,
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)