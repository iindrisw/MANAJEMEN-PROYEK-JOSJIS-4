# API Documentation — Racik Rasa

Base URL: `http://localhost:5000`

---

## Response Format

**Success tanpa data**
```json
{
  "status": "success",
  "message": "string"
}
```

**Success dengan data**
```json
{
  "status": "success",
  "message": "string",
  "data": {}
}
```

**Error**
```json
{
  "status": "failed",
  "message": "string"
}
```

**Validation Error `400`**
```json
{
  "status": "failed",
  "message": "validasi gagal",
  "errors": [
    { "field": "bahan", "message": "bahan minimal 1 dipilih" }
  ]
}
```

---

## 1. Modul Pencarian & Katalog Resep

*Catatan: Data yang tertera (seperti contoh bahan "ayam", "kol", "kentang") pada setiap kartu bersifat Data Dummy / Sample Data yang digunakan khusus untuk simulasi pengujian (testing) dan dapat disesuaikan.*

### Get Most Liked Recipes

Mengambil daftar resep terpopuler berdasarkan jumlah like tertinggi untuk ditampilkan di halaman utama (Landing Page / Beranda).

```
GET /api/most-liked
```

**Response `200 OK`**
```json
{
  "status": "success",
  "message": "berhasil dapet resep terpopuler",
  "data": {
    "recipes": []
  }
}
```

**Error Responses**

| Status | Kondisi          |
|--------|------------------|
| `500`  | Kesalahan server |

---

### Search Recipes by Ingredients

Mencari resep berdasarkan sisa bahan di dapur (menggunakan logika pencocokan bahan utama yang wajib ada dan skoring fleksibel untuk bahan tambahan).

```
GET /api/search-bahan
```

**Query Parameters**

| Param | Keterangan              |
|-------|-------------------------|
| `q`   | Kata kunci / nama bahan |

**Response `200 OK`**
```json
{
  "status": "success",
  "message": "berhasil mencari resep berdasarkan bahan",
  "data": {
    "recipes": []
  }
}
```

**Error Responses**

| Status | Kondisi          |
|--------|------------------|
| `400`  | Validasi gagal   |
| `500`  | Kesalahan server |

---

### Search Recipes by Name

Mencari resep secara langsung berdasarkan kata kunci atau judul/nama resep tertentu.

```
GET /api/search-resep
```

**Query Parameters**

| Param | Keterangan          |
|-------|---------------------|
| `q`   | Kata kunci pencarian|

**Response `200 OK`**
```json
{
  "status": "success",
  "message": "berhasil mencari resep",
  "data": {
    "recipes": []
  }
}
```

**Error Responses**

| Status | Kondisi          |
|--------|------------------|
| `400`  | Validasi gagal   |
| `500`  | Kesalahan server |

---

### Filter Recipes

Menyaring daftar resep berdasarkan kriteria khusus (pilihan alergi: Telur, Seafood, Kacang. Dan pilihan bebas pedas: bebas cabai dan bebas lada).

```
GET /api/filter
```

**Query Parameters**

| Param    | Keterangan      |
|----------|-----------------|
| `filter` | Kriteria filter |

**Response `200 OK`**
```json
{
  "status": "success",
  "message": "berhasil memfilter resep",
  "data": {
    "recipes": []
  }
}
```

**Error Responses**

| Status | Kondisi          |
|--------|------------------|
| `400`  | Validasi gagal   |
| `500`  | Kesalahan server |

---

## 2. Modul Detail & Interaksi Resep

### Get Recipe Detail

Menampilkan detail lengkap sebuah resep (termasuk porsi, status ketersediaan bahan, dan langkah-langkah memasak).

```
GET /api/recipes/:id
```

**URL Params**

| Param | Keterangan    |
|-------|---------------|
| `id`  | ID resep      |

**Response `200 OK`**
```json
{
  "status": "success",
  "message": "berhasil mengambil detail resep",
  "data": {
    "recipe": {}
  }
}
```

**Error Responses**

| Status | Kondisi                 |
|--------|-------------------------|
| `404`  | Resep tidak ditemukan   |
| `500`  | Kesalahan server        |

---

### Add Bookmark

Menyimpan resep ke daftar favorit pengguna (membutuhkan autentikasi token Bearer).

```
POST /api/recipes/:id/bookmark
```

**Headers**

| Key             | Value                  | Required |
|-----------------|------------------------|----------|
| `Authorization` | `Bearer <accessToken>` | ✅        |

**URL Params**

| Param | Keterangan    |
|-------|---------------|
| `id`  | ID resep      |

**Response `200 OK`**
```json
{
  "status": "success",
  "message": "berhasil menyimpan resep ke bookmark"
}
```

**Error Responses**

| Status | Kondisi                  |
|--------|--------------------------|
| `401`  | Tidak terautentikasi     |
| `404`  | Resep tidak ditemukan    |
| `500`  | Kesalahan server         |

---

### Delete Bookmark

Menghapus resep dari daftar simpanan favorit (membutuhkan autentikasi token Bearer).

```
DELETE /api/recipes/:id/bookmark
```

**Headers**

| Key             | Value                  | Required |
|-----------------|------------------------|----------|
| `Authorization` | `Bearer <accessToken>` | ✅        |

**URL Params**

| Param | Keterangan    |
|-------|---------------|
| `id`  | ID resep      |

**Response `200 OK`**
```json
{
  "status": "success",
  "message": "berhasil menghapus resep dari bookmark"
}
```

**Error Responses**

| Status | Kondisi                  |
|--------|--------------------------|
| `401`  | Tidak terautentikasi     |
| `404`  | Resep tidak ditemukan    |
| `500`  | Kesalahan server         |

---

## 3. Modul Autentikasi Pengguna (`/auth`)

### Register

Mendaftarkan akun baru secara manual (Nama, Email, Password).

```
POST /api/auth/register
```

**Request Body**
```json
{
  "name": "Ayes",
  "email": "ayes@example.com",
  "password": "rahasia123"
}
```

**Response `201 Created`**
```json
{
  "status": "success",
  "message": "berhasil membuat akun",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

**Error Responses**

| Status | Kondisi                 |
|--------|-------------------------|
| `400`  | Validasi gagal          |
| `401`  | Email sudah terdaftar   |
| `500`  | Kesalahan server        |

---

### Login

Masuk ke dalam sistem dan menghasilkan token akses JWT.

```
POST /api/auth/login
```

**Request Body**
```json
{
  "email": "ayes@example.com",
  "password": "rahasia123"
}
```

**Response `200 OK`**
```json
{
  "status": "success",
  "message": "berhasil login",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

**Error Responses**

| Status | Kondisi                  |
|--------|--------------------------|
| `400`  | Validasi gagal           |
| `401`  | Email / password salah   |
| `500`  | Kesalahan server         |

---

### Google Login

Masuk menggunakan akun Google (Google Social Login).

```
POST /api/auth/google
```

**Request Body**
```json
{
  "token": "google_id_token_string"
}
```

**Response `200 OK`**
```json
{
  "status": "success",
  "message": "berhasil login dengan Google",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

**Error Responses**

| Status | Kondisi              |
|--------|----------------------|
| `400`  | Token Google tidak valid |
| `500`  | Kesalahan server     |

---

### Logout

Keluar dari akun dan membersihkan sesi pengguna.

```
POST /api/auth/logout
```

**Response `200 OK`**
```json
{
  "status": "success",
  "message": "berhasil logout"
}
```

**Error Responses**

| Status | Kondisi          |
|--------|------------------|
| `500`  | Kesalahan server |

---

## 4. Modul Profil Pengguna (`/user`)

### Get User Profile

Mengambil data informasi profil pengguna yang sedang login (membutuhkan autentikasi token Bearer).

```
GET /api/user/profile
```

**Headers**

| Key             | Value                  | Required |
|-----------------|------------------------|----------|
| `Authorization` | `Bearer <accessToken>` | ✅        |

**Response `200 OK`**
```json
{
  "status": "success",
  "message": "berhasil mengambil profil pengguna",
  "data": {
    "user": {
      "name": "Ayes",
      "email": "ayes@example.com"
    }
  }
}
```

**Error Responses**

| Status | Kondisi                  |
|--------|--------------------------|
| `401`  | Tidak terautentikasi     |
| `404`  | User tidak ditemukan     |
| `500`  | Kesalahan server         |

---

> **Status Verifikasi:** Checklist SQA pada card yang bersangkutan telah terverifikasi (Lolos QA Test).