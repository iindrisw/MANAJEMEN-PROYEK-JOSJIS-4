import os
from dotenv import load_dotenv
import psycopg2

# Muat data dari file .env
load_dotenv()

# Ambil link DATABASE_URL
database_url = os.getenv("DATABASE_URL")

print("Menghubungkan ke database Supabase...")

try:
    # Coba koneksi ke PostgreSQL Supabase
    connection = psycopg2.connect(database_url)
    cursor = connection.cursor()
    
    # Jalankan kueri sederhana untuk tes waktu server database
    cursor.execute("SELECT version();")
    db_version = cursor.fetchone()
    
    print("\nSUKSES! Berhasil terhubung ke Supabase!")
    print(f"Versi Database: {db_version[0]}")
    
    # Tutup koneksi
    cursor.close()
    connection.close()
except Exception as error:
    print("\nGAGAL terhubung ke database:", error)