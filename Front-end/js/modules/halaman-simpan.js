import { createRecipeCard, renderPagination } from "./recipe-view.js";

const url = new URL(`${API_BASE_URL}/recipes/saved`);
const API_BASE_URL = "http://127.0.0.1:5000/api";

export function initHalamanSimpan() {
  const savedScreen = document.querySelector("#view-saved") || document.querySelector("#saved-screen");
  const searchInput = document.querySelector("#saved-search-input");
  const recipeGrid = document.querySelector("#saved-recipe-grid") || document.querySelector("#recipe-grid");
  const emptyState = document.querySelector("#saved-empty-state") || document.querySelector("#empty-state");
  const paginationContainer = document.querySelector("#saved-pagination") || document.querySelector(".pagination");

  if (!recipeGrid) return;

  let savedRecipes = [];
  let currentPage = 1;
  const itemsPerPage = 6;
  let currentSearchQuery = "";
  let debounceTimer = null;

  // Cek Token Login
  const token = localStorage.getItem("token");
  if (!token) {
    if (emptyState) {
      emptyState.textContent = "Silakan login terlebih dahulu untuk melihat resep tersimpan.";
      emptyState.hidden = false;
    }
    return;
  }

  // Fungsi untuk mengambil data resep tersimpan dari API (GET)
  async function fetchSavedRecipes(query = "") {
    try {
      if (emptyState) {
        emptyState.textContent = "Memuat resep tersimpan...";
        emptyState.hidden = false;
      }
      recipeGrid.replaceChildren();

      const url = new URL(`${API_BASE_URL}/recipes/saved`); // Sesuaikan endpoint backend jika berbeda
      if (query) {
        url.searchParams.set("q", query);
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (!response.ok || result.status === "error") {
        throw new Error(result.message || "Gagal memuat resep tersimpan.");
      }

      // Skenario 8: Urutan berdasarkan waktu simpan terbaru di atas (jika API belum mengurutkan)
      let data = Array.isArray(result.data) ? result.data : [];
      if (data.length > 0 && data[0].saved_at) {
        data.sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at));
      }

      savedRecipes = data;
      currentPage = 1;
      renderCurrentPage();

    } catch (error) {
      console.error("Error fetching saved recipes:", error);
      if (emptyState) {
        emptyState.textContent = "Gagal memuat resep tersimpan dari server.";
        emptyState.hidden = false;
      }
    }
  }

  // Render kartu resep per halaman dengan Pagination & Empty State
  function renderCurrentPage() {
    recipeGrid.replaceChildren();

    // Skenario 2 & 5: Validasi Kondisi Kosong / Pencarian Tidak Ditemukan
    if (savedRecipes.length === 0) {
      if (emptyState) {
        emptyState.textContent = currentSearchQuery 
          ? "Resep tidak ditemukan" 
          : "Belum ada resep yang disimpan";
        emptyState.hidden = false;
      }
      if (paginationContainer) paginationContainer.hidden = true;
      return;
    }

    if (emptyState) emptyState.hidden = true;

    // Kalkulasi Pagination
    const totalPages = Math.ceil(savedRecipes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = savedRecipes.slice(startIndex, startIndex + itemsPerPage);

    paginatedItems.forEach(recipe => {
      const card = createRecipeCard(recipe);
      
      // Skenario 3: Membuka detail resep saat gambar/judul diklik
      card.addEventListener("click", () => {
        if (typeof window.openRecipeDetailCustom === "function") {
          window.openRecipeDetailCustom(recipe.id_resep);
        } else {
          // Fallback navigasi detail resep
          window.location.hash = `recipe-${recipe.id_resep}`;
        }
      });

      // Skenario 7: Tombol/ikon hapus pada kartu resep tersimpan (DELETE)
      const bookmarkIcon = card.querySelector(".detail-bookmark, .recipe-bookmark, .like-icon") || card;
      // Jika ada tombol bookmark di kartu, ubah fungsinya menjadi hapus
      bookmarkIcon.addEventListener("click", async (e) => {
        e.stopPropagation(); // Mencegah membuka detail saat ikon hapus diklik
        await removeSavedRecipe(recipe.id_resep, card);
      });

      recipeGrid.append(card);
    });

    // Render Pagination (Skenario 6)
    if (paginationContainer) {
      renderPagination(paginationContainer, currentPage, totalPages, (newPage) => {
        currentPage = newPage;
        renderCurrentPage();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      paginationContainer.hidden = totalPages <= 1;
    }
  }

  // Fungsi Menghapus Resep dari Daftar Simpanan (Skenario 7 & DELETE API)
  async function removeSavedRecipe(recipeId, cardElement) {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/bookmark`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Kartu langsung menghilang dari layar (Optimistic UI / State update)
        savedRecipes = savedRecipes.filter(r => r.id_resep !== recipeId);
        cardElement.remove();
        renderCurrentPage();

        // Munculkan Pop-up "Resep dihapus dari daftar simpanan" dan "Oke mengerti"
        showDeletePopup();
      } else {
        alert("Gagal menghapus resep dari simpanan.");
      }
    } catch (err) {
      console.error("Gagal menghapus:", err);
    }
  }

  // Pop-up Konfirmasi Hapus Sesuai Skenario 7
  function showDeletePopup() {
    document.getElementById("delete-saved-popup")?.remove();

    const dialog = document.createElement("dialog");
    dialog.id = "delete-saved-popup";
    dialog.className = "validation-dialog";
    dialog.innerHTML = `
      <div style="padding: 24px 20px; background: var(--cream, #FFFBE9); border-radius: 16px; border: 3px solid #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.2); text-align: center;">
        <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: var(--charcoal, #333);">Resep dihapus dari daftar simpanan</p>
        <button id="btn-oke-mengerti" style="padding: 8px 24px; border-radius: 10px; border: 0; background: var(--coral, #D05756); color: white; cursor: pointer; font-weight: 600;">Oke mengerti</button>
      </div>
    `;
    document.body.appendChild(dialog);
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    }

    document.getElementById("btn-oke-mengerti").onclick = () => {
      dialog.close();
      dialog.remove();
    };
  }

  // Skenario 4 & Task Teknis: Fungsi Debounce pada Kolom Pencarian
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();
      currentSearchQuery = query;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchSavedRecipes(query);
      }, 400); // Debounce 400ms agar API tidak dipanggil setiap ketukan huruf
    });
  }

  // Inisialisasi awal saat halaman dibuka
  fetchSavedRecipes();
}