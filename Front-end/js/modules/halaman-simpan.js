import { createRecipeCard, renderPagination } from "./recipe-view.js";

const API_BASE_URL = "http://127.0.0.1:5000/api";
const ITEMS_PER_PAGE = 6;

export function initHalamanSimpan() {
  const appShell = document.querySelector(".app-shell");
  const searchPanel = document.querySelector(".search-panel");
  const sectionLabel = document.querySelector(".section-label");
  const recipeContent = document.querySelector(".recipe-content");
  const savedScreen = document.querySelector("#view-saved");
  const searchForm = document.querySelector("#saved-search-form");
  const searchInput = document.querySelector("#saved-search-input");
  const recipeGrid = document.querySelector("#saved-recipe-grid");
  const emptyState = document.querySelector("#saved-empty-state");
  const paginationContainer = document.querySelector("#saved-pagination");

  if (
    !(appShell instanceof HTMLElement) ||
    !(searchPanel instanceof HTMLElement) ||
    !(sectionLabel instanceof HTMLElement) ||
    !(recipeContent instanceof HTMLElement) ||
    !(savedScreen instanceof HTMLElement) ||
    !(searchForm instanceof HTMLFormElement) ||
    !(searchInput instanceof HTMLInputElement) ||
    !(recipeGrid instanceof HTMLElement) ||
    !(emptyState instanceof HTMLElement) ||
    !(paginationContainer instanceof HTMLElement)
  ) {
    throw new Error("Elemen halaman resep tersimpan tidak ditemukan.");
  }

  const homeTitle = sectionLabel.textContent;
  let savedRecipes = [];
  let currentPage = 1;
  let currentSearchQuery = "";
  let latestRequestId = 0;
  let renderTimer = 0;

  function setSavedView(isOpen) {
    appShell.classList.toggle("is-saved-view", isOpen);
    savedScreen.hidden = !isOpen;
    searchPanel.hidden = false;
    recipeContent.hidden = isOpen;
    sectionLabel.textContent = isOpen ? "SIMPAN RESEP" : homeTitle;
  }

  async function fetchBookmarkPage(page, token) {
    const url = new URL(`${API_BASE_URL}/users/me/bookmarks`);
    url.searchParams.set("page", String(page));
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (!response.ok || result.status === "error") {
      const error = new Error(result.message || "Gagal memuat resep tersimpan.");
      error.status = response.status;
      throw error;
    }

    const pageData = result.data;

    // Jika server langsung mengembalikan array daftar resep
    if (Array.isArray(pageData)) {
      return { data: pageData, total_halaman: 1 };
    }

    // Jika server mengembalikan objek berpaginasi standar { data: [...], total_halaman: ... }
    if (pageData && Array.isArray(pageData.data)) {
      return pageData;
    }

    throw new Error("Format daftar resep tersimpan dari server tidak valid.");
  }

  async function loadSavedRecipes() {
    const requestId = ++latestRequestId;
    const token = localStorage.getItem("token");
    if (!token) {
      savedRecipes = [];
      recipeGrid.replaceChildren();
      paginationContainer.replaceChildren();
      paginationContainer.hidden = true;
      emptyState.textContent =
        "Login belum tersedia. Resep tersimpan akan tampil setelah Anda masuk.";
      emptyState.hidden = false;
      return;
    }

    emptyState.textContent = "Memuat resep tersimpan...";
    emptyState.hidden = false;
    recipeGrid.replaceChildren();
    paginationContainer.hidden = true;

    try {
      const firstPage = await fetchBookmarkPage(1, token);
      const totalPages = Math.max(1, Number(firstPage.total_halaman) || 1);
      const recipes = [...firstPage.data];

      for (let page = 2; page <= totalPages; page += 1) {
        const pageData = await fetchBookmarkPage(page, token);
        recipes.push(...pageData.data);
      }

      if (requestId !== latestRequestId) {
        return;
      }

      savedRecipes = recipes;
      currentPage = 1;
      renderCurrentPage();
    } catch (error) {
      if (requestId !== latestRequestId) {
        return;
      }
      if (error.status === 401) {
        localStorage.removeItem("token");
        savedRecipes = [];
        recipeGrid.replaceChildren();
        paginationContainer.replaceChildren();
        paginationContainer.hidden = true;
        emptyState.hidden = true;
        window.dispatchEvent(new Event("recipe:saved-auth-required"));
        return;
      }
      console.error("Gagal memuat resep tersimpan:", error);
      emptyState.textContent = `Resep tersimpan tidak dapat dimuat. ${error.message}`;
      emptyState.hidden = false;
      recipeGrid.replaceChildren();
    }
  }

  function renderCurrentPage(animate = false) {
    const filteredRecipes = savedRecipes.filter((recipe) =>
      String(recipe.nama_resep || "")
        .toLocaleLowerCase("id")
        .includes(currentSearchQuery),
    );
    const totalPages = Math.ceil(filteredRecipes.length / ITEMS_PER_PAGE);
    const render = () => {
      recipeGrid.replaceChildren();

      if (filteredRecipes.length === 0) {
        emptyState.textContent = currentSearchQuery
          ? "Resep tidak ditemukan."
          : "Belum ada resep yang disimpan.";
        emptyState.hidden = false;
        paginationContainer.replaceChildren();
        paginationContainer.hidden = true;
        return;
      }

      emptyState.hidden = true;
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const pageRecipes = filteredRecipes.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE,
      );

      for (const recipe of pageRecipes) {
        const card = createRecipeCard(recipe);
        card.addEventListener("click", () => {
          window.dispatchEvent(
            new CustomEvent("recipe:open-detail-from-saved", {
              detail: recipe.id_resep,
            }),
          );
        });
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            window.dispatchEvent(
              new CustomEvent("recipe:open-detail-from-saved", {
                detail: recipe.id_resep,
              }),
            );
          }
        });
        recipeGrid.append(card);
      }

      renderPagination(
        paginationContainer,
        currentPage,
        totalPages,
        (page) => {
          currentPage = page;
          renderCurrentPage(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
      );
    };

    window.clearTimeout(renderTimer);
    if (!animate || recipeGrid.childElementCount === 0) {
      render();
      return;
    }

    recipeGrid.style.opacity = "0";
    renderTimer = window.setTimeout(() => {
      render();
      requestAnimationFrame(() => {
        recipeGrid.style.opacity = "";
      });
    }, 120);
  }

  searchInput.addEventListener("input", () => {
    currentSearchQuery = searchInput.value.trim().toLocaleLowerCase("id");
    currentPage = 1;
    renderCurrentPage(true);
  });
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  window.addEventListener("recipe:navigate-saved", () => {
    setSavedView(true);
    searchInput.value = "";
    currentSearchQuery = "";
    currentPage = 1;

    if (!localStorage.getItem("token")) {
      savedRecipes = [];
      recipeGrid.replaceChildren();
      paginationContainer.replaceChildren();
      paginationContainer.hidden = true;
      emptyState.hidden = true;
      window.dispatchEvent(new Event("recipe:saved-auth-required"));
      return;
    }

    void loadSavedRecipes();
  });
  window.addEventListener("recipe:navigate-home", () => setSavedView(false));
  window.addEventListener("recipe:saved-refresh", () => {
    if (!savedScreen.hidden) {
      void loadSavedRecipes();
    }
  });
}
