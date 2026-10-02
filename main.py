from flask import Flask, jsonify, request
from sqlalchemy import create_engine, text

app = Flask(__name__)

# Hubungkan ke database PostgreSQL kamu
db_url = "postgresql+psycopg2://postgres:indri123@localhost:5432/Racik_rasa"
engine = create_engine(db_url)


@app.route("/api/search-bahan", methods=["GET"])
def cari_resep_berdasarkan_bahan():
  # Ambil kata kunci dari URL, contoh: /api/search-bahan?q=ayam
  keyword = request.args.get("q", "").strip().lower()

  if not keyword:
    return jsonify({"status": "error", "message": "Kata kunci bahan tidak boleh kosong!"}), 400

  # Query SQL untuk mencari resep berdasarkan bahan, urutkan dari like terbanyak, ambil 5 teratas
  query = text("""
        SELECT DISTINCT r.id_resep, r.nama_resep, r.jumlah_like, r.url
        FROM "Resep" r
        JOIN "Resep_bahan" rb ON r.id_resep = rb.id_resep
        JOIN bahan b ON rb.id_bahan = b.id_bahan
        WHERE LOWER(b.nama_bahan) LIKE :keyword
        ORDER BY r.jumlah_like DESC
        LIMIT 5;
    """)

  with engine.connect() as conn:
    result = conn.execute(query, {"keyword": f"%{keyword}%"}).fetchall()

    # Ubah hasil database ke format list of dictionary (JSON)
    list_resep = []
    for row in result:
      list_resep.append({
          "id_resep": row[0],
          "nama_resep": row[1],
          "jumlah_like": row[2],
          "url": row[3],
      })

  return jsonify({
      "keyword_pencarian": keyword,
      "total_ditemukan": len(list_resep),
      "data": list_resep,
  })


if __name__ == "__main__":
  app.run(debug=True, port=5000)