import os
from dotenv import load_dotenv, find_dotenv
import psycopg2

# Memaksa python mencari file .env secara otomatis
load_dotenv(find_dotenv())

database_url = os.getenv("DATABASE_URL")
print("URL yang dibaca:", database_url)  # Cek apakah ini muncul link Supabase atau None

print("Menghubungkan ke database Supabase...")

try:
    connection = psycopg2.connect(database_url)
    cursor = connection.cursor()
    
    cursor.execute("SELECT version();")
    db_version = cursor.fetchone()
    
    print("\nSUKSES! Berhasil terhubung ke Supabase!")
    print(f"Versi Database: {db_version[0]}")
    
    cursor.close()
    connection.close()
except Exception as error:
    print("\nGAGAL terhubung ke database:", error)