"""Definisi tabel resep (sesuai skema di dbrr.sql) + serializer baris -> dict.

Nama tabel diberi tanda kutip karena di database memakai huruf besar ("Resep").
"""

T_RESEP = '"Resep"'              # id_resep, nama_resep, langkah, jumlah_like, url
T_RESEP_BAHAN = '"Resep_bahan"'  # id_resep_bahan, id_resep, id_bahan, takaran, is_bumbu_dasar
T_BAHAN = "bahan"                # id_bahan, nama_bahan, is_alergen, is_pedas


def resep_ringkas(row):
    """Kartu resep untuk daftar/pencarian."""
    return {
        "id_resep": row["id_resep"],
        "nama_resep": row["nama_resep"],
        "jumlah_like": row["jumlah_like"] or 0,
        "url": row["url"],
        "bahan_terpakai": [],
    }


def bahan_item(row):
    return {
        "nama_bahan": row["nama_bahan"],
        "takaran": row["takaran"],
        "is_bumbu_dasar": bool(row["is_bumbu_dasar"]),
        "is_alergen": bool(row["is_alergen"]),
        "is_pedas": bool(row["is_pedas"]),
    }
