# Racik Rasa – Backend (Flask)

## Struktur
```
racik-rasa-backend/
├── run.py                         # entry point:  python run.py
├── requirements.txt
├── .env / .env.example
├── migrations/001_auth_google_interaksi.sql
├── scripts/                       # import_dump.py, check_db.py, run_migration.py
├── tests/test_unit.py
└── src/
    ├── __init__.py                # create_app() (factory)
    ├── config/    settings.py, database.py
    ├── middlewares/ auth_middleware.py (JWT), error_handler.py
    ├── models/    recipe_model.py, user_model.py, interaction_model.py
    ├── routes/    auth_routes.py, recipe_routes.py, user_routes.py
    ├── dev/       dev_console.html (halaman uji /dev, hanya mode debug)
    ├── schemas/   validation.py
    ├── services/  recipe_service.py, auth_service.py, interaction_service.py
    └── utils/     helpers.py, errors.py
```

## Menjalankan
```bash
pip install -r requirements.txt
python scripts/run_migration.py        # SEKALI SAJA (kolom Google + unique like/bookmark + index)
python run.py                          # http://localhost:5000
```

## Endpoint
Semua respons: `{"status":"success", ...}` atau `{"status":"error","message":"...","code":"..."}`.
Endpoint bertanda 🔒 butuh header `Authorization: Bearer <token>`.

| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/recipes/search?utama=ayam&tambahan=kacang,bawang,kecap,tahu,tempe&page=1&filters=nuts` | Pencarian kombinasi. `utama` wajib **1**, `tambahan` maks **5**. |
| GET | `/api/recipes/search-name?q=` | Cari berdasarkan nama resep |
| GET | `/api/recipes/most-liked` | Resep terpopuler |
| GET | `/api/recipes/<id>` | Detail: bahan + langkah terstruktur |
| GET | `/api/recipes/<id>/cooking-mode` | Mode memasak: 1 langkah = 1 layar |
| POST/DELETE 🔒 | `/api/recipes/<id>/like` | Like / unlike |
| POST/DELETE 🔒 | `/api/recipes/<id>/bookmark` | Simpan / hapus simpan |
| GET 🔒 | `/api/users/me/likes`, `/api/users/me/bookmarks` | Daftar milik user |
| POST | `/api/auth/register` `{nama,email,password}` | Daftar (password min 8) |
| POST | `/api/auth/login` `{email,password}` | Login |
| POST | `/api/auth/google` `{id_token}` | Login Google |
| GET 🔒 | `/api/auth/me` | Profil |

Route lama tetap hidup agar FE tidak perlu diubah: `/api/most-liked`, `/api/search-bahan?q=ayam,kacang,...`, `/api/search-resep`, `/api/cek-nama-resep`.

### Aturan input pencarian
- **Bahan utama**: wajib 1, **tidak boleh ada koma** (`utama=ayam,` → 400). Harus bahan sungguhan; nama menu (`nasi goreng`, `soto`, `rendang`, `opor`, ...) ditolak dengan pesan "gunakan Cari Resep Langsung".
- **Bahan tambahan**: maksimal 5. Koma ke-6 langsung ditolak (`a,b,c,d,e,` → 400); `a,b,c,d,` (4 + koma) masih boleh karena user sedang mengetik bahan ke-5.
- Bahan tambahan yang tidak dikenal (salah ketik) tidak error, tapi dilaporkan di `bahan_tambahan_tidak_dikenal`.
- Aturan "tidak boleh koma di bahan utama" hanya bisa ditegakkan kalau FE mengirim `utama` dan `tambahan` **terpisah**. Format lama `q=ayam,a,b` tidak bisa membedakan kolom (koma-nya jadi pemisah).

### Urutan hasil pencarian kombinasi
Bahan utama itu **filter wajib dan harus bahan sungguhan**: resep yang cuma memakai "kaldu ayam", "royco ayam", "bumbu ayam goreng", atau "telur ayam" bukan resep ayam. Pencocokan di **awal kata** ("ikan" tidak lagi cocok dengan "disesuaikan").

Urutan, dari atas:
1. Jumlah bahan tambahan yang cocok, terbanyak dulu (utama + 5 → utama + 4 → … → utama saja).
2. Dalam tingkat yang sama: resep yang **judulnya** memuat bahan utama (mis. "Ayam Geprek").
3. Lalu resep yang cocok dengan bahan tambahan yang diketik lebih dulu.
4. Jumlah like.

Tiap resep membawa `jumlah_cocok`, `bahan_cocok`, `bahan_kurang`, `label_kombinasi`; respons membawa `kombinasi` (jumlah resep per tingkat).

## Cara mengetes tanpa FE
1. Pastikan `FLASK_DEBUG=true` di `.env`, jalankan `python run.py`.
2. Buka **http://localhost:5000/dev**: register, login, cari kombinasi, like, simpan, lihat daftar milik saya, dan coba mode memasak per langkah. Respons JSON mentah tampil di bagian bawah.
3. Atau lewat curl:
```bash
curl -X POST localhost:5000/api/auth/register -H "Content-Type: application/json" \
  -d '{"nama":"Budi","email":"budi@mail.com","password":"rahasia123"}'
# salin "token" dari respons:
TOKEN=eyJ...
curl -X POST   localhost:5000/api/recipes/1/like     -H "Authorization: Bearer $TOKEN"
curl -X POST   localhost:5000/api/recipes/1/bookmark -H "Authorization: Bearer $TOKEN"
curl           localhost:5000/api/users/me/bookmarks -H "Authorization: Bearer $TOKEN"
curl "localhost:5000/api/recipes/search?utama=ayam&tambahan=cabe,kacang,bawang,tahu"
```
4. Login Google tidak bisa dicoba di `/dev` tanpa `id_token` asli dari FE (butuh `GOOGLE_CLIENT_ID`). Endpoint-nya sudah siap; logika tautan akun diuji dengan token tiruan.
5. `/dev` otomatis mati kalau `FLASK_DEBUG` bukan `true` (jangan aktifkan di production).

### Login Google (sisi FE)
FE memakai Google Identity Services, lalu kirim `credential` yang didapat ke `POST /api/auth/google` sebagai `id_token`.
Isi `GOOGLE_CLIENT_ID` di `.env` dengan Client ID (Web) yang sama dengan yang dipakai FE.
