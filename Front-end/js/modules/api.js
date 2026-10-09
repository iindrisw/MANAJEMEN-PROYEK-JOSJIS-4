import { showCustomModal, renderBackendRecipesPage } from './ui.js';
import { dapatkanBahanTerpisah } from './input.js';

const initialRecipes = [
  {
    nama_resep: "Sate Telur Gulung Crispy Ekonomis Isi Sosis",
    bahan_terpakai: ["BLOK KALDU AYAM", "AIR", "BUTIR TELUR", "MINYAK GORENG", "SOSIS", "LADA BUBUK", "GARAM", "BAWANG PUTIH HALUSKAN"],
    bahan_tidak_tersedia: []
  },
  {
    nama_resep: "Ayam Goreng Bawang Khas Batam",
    bahan_terpakai: ["AYAM", "BAWANG PUTIH", "GARAM", "LADA BUBUK"],
    bahan_tidak_tersedia: []
  },
  {
    nama_resep: "Ayam Goreng Kecap",
    bahan_terpakai: ["GULA", "BAWANG PUTIH ULEK HALUS CINCANG HALUS", "CABE MERAH IRIS SERONG", "CM JAHE MEMARKAN", "BAWANG BOMBAY IRIS"],
    bahan_tidak_tersedia: []
  },
  {
    nama_resep: "Menu dinner trio tumis - pokcoy, ayam bawang putih, bawang merah",
    bahan_terpakai: ["BATANG POKCOY", "BAWANG MERAH", "TUMIS POKCOY", "GULA"],
    bahan_tidak_tersedia: []
  },
  {
    nama_resep: "Nasi Goreng Mas Hilal loh ya",
    bahan_terpakai: ["KENTANG", "WORTEL", "SLEDRI", "CICAK"],
    bahan_tidak_tersedia: []
  }
];

export let currentRecipeData = [...initialRecipes];

export async function jalankanPencarianBackend() {
  const recipeListContainer = document.getElementById('recipeList');
  const { utama, lainnya } = dapatkanBahanTerpisah();

  if (!utama && !lainnya) {
    showCustomModal("Masukkan minimal satu bahan utama atau bahan lainnya!", "Peringatan");
    return;
  }

  if (recipeListContainer) {
    recipeListContainer.innerHTML = `<p style="text-align:center; grid-column: span 2; font-weight:bold; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat Resep...</p>`;
  }

  try {
    const url = `http://127.0.0.1:5000/api/search-bahan?utama=${encodeURIComponent(utama)}&lainnya=${encodeURIComponent(lainnya)}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`Status HTTP ${response.status}`);

    const result = await response.json();

    if (result.data && result.data.length > 0) {
      currentRecipeData = result.data;
      renderBackendRecipesPage(currentRecipeData, 1, 6, (newPage) => {
        renderBackendRecipesPage(currentRecipeData, newPage, 6, arguments.callee);
      });
    } else {
      currentRecipeData = [];
      if (recipeListContainer) {
        const kataBahan = [utama, lainnya].filter(Boolean).join(', ');
        recipeListContainer.innerHTML = `<p style="text-align:center; grid-column: span 2; padding: 20px;">Tidak ditemukan resep untuk bahan "${kataBahan}".</p>`;
      }
    }
  } catch (error) {
    console.error("Gagal terhubung ke backend:", error);
    showCustomModal(`Gagal memuat resep (${error.message}). Pastikan server Flask di main.py sudah berjalan.`, "Koneksi Error");
    if (recipeListContainer) recipeListContainer.innerHTML = '';
  }
}

export async function loadInitialRecipesFromBackend() {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/search-bahan?utama=&lainnya=');
    if (response.ok) {
      const result = await response.json();
      if (result.data && result.data.length > 0) {
        currentRecipeData = result.data;
        renderBackendRecipesPage(currentRecipeData, 1, 6, (newPage) => {
          renderBackendRecipesPage(currentRecipeData, newPage, 6, arguments.callee);
        });
      }
    }
  } catch (e) {
    // Pakai initialRecipes default jika offline
  }
}