import glob
import re
import pandas as pd
from sqlalchemy import create_engine, text

# 1. Hubungkan ke database PostgreSQL
engine = create_engine(
    "postgresql+psycopg2://postgres:indri123@localhost:5432/Racik_rasa"
)

# Definisi Kata Kunci untuk Klasifikasi
LIST_ALERGEN = ["udang", "kacang", "telur", "kepiting", "susu", "keju", "gluten"]
LIST_PEDAS = ["cabe", "cabai", "merica", "lada", "rawit", "sambal"]
LIST_BUMBU_DASAR = [
    "bawang",
    "kemiri",
    "kunyit",
    "jahe",
    "lengkuas",
    "serai",
    "sereh",
    "ketumbar",
    "merica",
    "lada",
]


def pisah_takaran_dan_bahan(teks_mentah):
  teks_kecil = teks_mentah.lower()

  # Pola untuk mendeteksi takaran/angka di depan
  match = re.match(
      r"^([\d\/\.\-\s]+(?:gr|kg|ml|sdt|sdm|buah|siung|lembar|batang|ekor|bungkus|bks|papan|potong|butir|ikat)?)\s*(.*)",
      teks_kecil,
  )

  if match:
    takaran = match.group(1).strip()
    sisa_nama = match.group(2).strip()
  else:
    takaran = "secukupnya"
    sisa_nama = teks_kecil

  # Bersihkan nama bahan dari sisa simbol atau takaran yang tertinggal
  nama_bersih = re.sub(r"\(.*?\)", "", sisa_nama)
  nama_bersih = re.sub(r"[\d\/\-\(\)\,\&\+\:]+", " ", nama_bersih).strip()

  return takaran if takaran else "secukupnya", nama_bersih


semua_file_csv = glob.glob("dataset-*.csv")
print("Memulai proses migrasi data bersih...")

for file in semua_file_csv:
  df = pd.read_csv(file, encoding="utf-8")

  if "Ingredients" not in df.columns or "Title" not in df.columns:
    continue

  for index, row in df.iterrows():
    nama_resep = row.get("Title")
    raw_ingredients = str(row.get("Ingredients", ""))
    langkah = str(row.get("Steps", ""))
    jumlah_like = row.get("Loves", 0)
    url = row.get("URL", "")

    if not nama_resep or pd.isna(nama_resep):
      continue

    with engine.begin() as conn:
      # 1. Masukkan atau ambil id_resep
      res_resep = conn.execute(
          text('SELECT id_resep FROM "Resep" WHERE nama_resep = :nama LIMIT 1'),
          {"nama": nama_resep},
      ).fetchone()

      if res_resep:
        id_resep = res_resep[0]
      else:
        ins_resep = conn.execute(
            text(
                'INSERT INTO "Resep" (nama_resep, langkah, jumlah_like, url)'
                " VALUES (:nama, :langkah, :like, :url) RETURNING id_resep"
            ),
            {
                "nama": nama_resep,
                "langkah": langkah if pd.notna(langkah) else "",
                "like": int(jumlah_like) if pd.notna(jumlah_like) else 0,
                "url": str(url) if pd.notna(url) else "",
            },
        ).fetchone()
        id_resep = ins_resep[0]

      # 2. Proses Bahan & Takaran
      if raw_ingredients and raw_ingredients != "nan":
        list_bahan_mentah = raw_ingredients.split("--")
        for item in list_bahan_mentah:
          item_bersih_str = item.strip()
          if not item_bersih_str:
            continue

          # Pisahkan mana takaran, mana nama bahan murni
          takaran, nama_bahan = pisah_takaran_dan_bahan(item_bersih_str)

          if len(nama_bahan) < 2:
            continue
          nama_bahan = nama_bahan[:100]

          # Cek Logika Kategori Otomatis
          is_alerg = any(alg in nama_bahan for alg in LIST_ALERGEN)
          is_pds = any(pds in nama_bahan for pds in LIST_PEDAS)
          is_bumbu = any(bumbu in nama_bahan for bumbu in LIST_BUMBU_DASAR)

          # Cek apakah bahan sudah ada di tabel 'bahan'
          get_bahan = conn.execute(
              text("SELECT id_bahan FROM bahan WHERE nama_bahan = :nama"),
              {"nama": nama_bahan},
          ).fetchone()

          if get_bahan:
            id_bahan = get_bahan[0]
          else:
            ins_bahan = conn.execute(
                text(
                    "INSERT INTO bahan (nama_bahan, is_alergen, is_pedas) VALUES"
                    " (:nama, :alerg, :pds) RETURNING id_bahan"
                ),
                {"nama": nama_bahan, "alerg": is_alerg, "pds": is_pds},
            ).fetchone()
            id_bahan = ins_bahan[0]

          # 3. Masukkan ke Resep_bahan (Cek duplikat relasi - TANPA WALRUS)
          cek_relasi = conn.execute(
              text(
                  'SELECT 1 FROM "Resep_bahan" WHERE id_resep = :r AND id_bahan'
                  " = :b"
              ),
              {"r": id_resep, "b": id_bahan},
          ).fetchone()

          if not cek_relasi:
            conn.execute(
                text(
                    'INSERT INTO "Resep_bahan" (id_resep, id_bahan, takaran,'
                    " is_bumbu_dasar) VALUES (:r, :b, :t, :bumbu)"
                ),
                {
                    "r": id_resep,
                    "b": id_bahan,
                    "t": takaran[:50],
                    "bumbu": is_bumbu,
                },
            )

  print(f"Selesai file: {file}")

print("Mantap! Data resep, bahan, takaran terpisah, dan bumbu dasar sukses tersimpan rapi!")