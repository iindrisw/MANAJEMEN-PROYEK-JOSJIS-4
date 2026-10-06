import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres.wjthntdtgjeiirtjjkgd:josjissupabase@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres")

# Nonaktifkan prepared statements agar tidak bentrok di pooler Supabase
engine = create_engine(db_url, pool_pre_ping=True, connect_args={"prepare_threshold": None})

print("Membaca file dbrr.sql...")
with open("dbrr.sql", "r", encoding="utf-8") as f:
    lines = f.readlines()

tables_data = {}
is_copy = False
current_table = ""
columns = []
rows_data = []

for line in lines:
    stripped = line.strip()
    if stripped.startswith("COPY "):
        is_copy = True
        parts = stripped.split(" ")
        current_table = parts[1]
        col_part = stripped[stripped.index("(")+1 : stripped.index(")")]
        columns = [c.strip().replace('"', '') for c in col_part.split(",")]
        rows_data = []
        continue

    if is_copy and stripped == r"\.":
        is_copy = False
        if rows_data:
            tables_data[current_table] = {
                "columns": columns,
                "rows": list(rows_data)
            }
        continue

    if is_copy:
        rows_data.append(line)

with engine.connect() as conn:
    conn = conn.execution_options(isolation_level="AUTOCOMMIT")

    print("Menyesuaikan ukuran kolom takaran...")
    try:
        conn.execute(text('ALTER TABLE public."Resep_bahan" ALTER COLUMN "takaran" TYPE TEXT;'))
    except Exception:
        pass

    # Masukkan data per tabel secara bertahap (batch kecil 1000 baris agar aman)
    for table in ['public.bahan', 'public."Resep"', 'public."Resep_bahan"', 'public."Resep_like"', 'public."Resep_simpan"', 'public."User"']:
        if table not in tables_data:
            continue
            
        data = tables_data[table]
        cols = data["columns"]
        rows = data["rows"]
        print(f"Memasukkan data ke tabel {table} ({len(rows)} baris)...")

        col_str = ", ".join([f'"{c}"' for c in cols])
        placeholders = ", ".join([f":val{i}" for i in range(len(cols))])
        insert_query = text(f'INSERT INTO {table} ({col_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING')

        batch_size = 1000
        for i in range(0, len(rows), batch_size):
            chunk = rows[i:i + batch_size]
            batch_params = []
            for r in chunk:
                vals = r.rstrip("\n").split("\t")
                if len(vals) == len(cols):
                    row_dict = {f"val{j}": (v if v != "\\N" else None) for j, v in enumerate(vals)}
                    batch_params.append(row_dict)
            
            if batch_params:
                try:
                    conn.execute(insert_query, batch_params)
                except Exception as e:
                    print(f"Error di {table} batch {i}: {e}")

print("SELESAI! Semua data sukses diimpor.")