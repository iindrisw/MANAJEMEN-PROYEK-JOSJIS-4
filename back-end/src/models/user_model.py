"""Definisi tabel user. Kolom google_id / avatar_url / auth_provider ditambah lewat
migrations/001_auth_google_interaksi.sql."""

T_USER = '"User"'  # id_user, nama, email, password(nullable), google_id, avatar_url, auth_provider, created_at


def user_publik(row):
    """Data user yang aman dikirim ke FE (tanpa password)."""
    return {
        "id_user": row["id_user"],
        "nama": row["nama"],
        "email": row["email"],
        "avatar_url": row["avatar_url"],
        "auth_provider": row["auth_provider"],
    }
