import { createRecipeCard, renderPagination } from "./recipe-view.js";
import { renderRecipeDetail } from "./recipe-detail.js";
import { initFilters } from "./filters.js";

const MAX_INGREDIENTS = 5;
const API_BASE_URL = "http://127.0.0.1:5000/api";

function getIngredients(value) {
  return value
    .split(/[,;\n]+/)
    .map((ingredient) => ingredient.trim().toLocaleLowerCase("id"))
    .filter(Boolean);
}

async function fetchRecipes(endpoint, params = {}) {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || result.status === "error") {
    throw new Error(result.message || "Permintaan resep gagal.");
  }
  return result;
}

export function initInput() {
  const recipeSearchForm = document.querySelector("#recipe-search");
  const ingredientSearchForm = document.querySelector("#ingredient-search");
  const recipeGrid = document.querySelector("#recipe-grid");
  const searchPanel = document.querySelector(".search-panel");
  const recipeContent = document.querySelector(".recipe-content");
  const detailScreen = document.querySelector("#recipe-detail");
  const detailTitle = document.querySelector("#detail-recipe-title");
  const detailFeedback = document.querySelector("#detail-feedback");
  const detailBackButton = document.querySelector("#detail-back");
  const detailLikeButton = document.querySelector("#detail-like");
  const detailBookmarkButton = document.querySelector("#detail-bookmark");
  const detailStepsButton = document.querySelector("#detail-steps");
  const stepsScreen = document.querySelector("#recipe-steps-screen");   const stepsDialogClose = document.querySelector("#steps-dialog-close");
  const copySuccessDialog = document.querySelector("#copy-success-dialog");
  const copySuccessClose = document.querySelector("#copy-success-close");
  const emptyState = document.querySelector("#empty-state");
  const pagination = document.querySelector(".pagination");
  const ingredientCount = document.querySelector("#ingredient-count");
  const ingredientSearchButton = ingredientSearchForm?.querySelector(
    'button[type="submit"]',
  );
  const validationDialog = document.querySelector("#validation-dialog");
  const validationMessage = document.querySelector("#validation-message");
  const validationDialogButton = validationDialog?.querySelector("button");

  if (
    !recipeSearchForm ||
    !ingredientSearchForm ||
    !recipeGrid ||
    !(searchPanel instanceof HTMLElement) ||
    !(recipeContent instanceof HTMLElement) ||
    !(detailScreen instanceof HTMLElement) ||
    !(detailTitle instanceof HTMLElement) ||
    !(detailFeedback instanceof HTMLElement) ||
    !(detailBackButton instanceof HTMLButtonElement) ||
    !(detailLikeButton instanceof HTMLButtonElement) ||
    !(detailBookmarkButton instanceof HTMLButtonElement) ||
    !(detailStepsButton instanceof HTMLButtonElement) ||
    !(stepsScreen instanceof HTMLElement) ||    !(stepsDialogClose instanceof HTMLButtonElement) ||
    !(copySuccessDialog instanceof HTMLDialogElement) ||
    !(copySuccessClose instanceof HTMLButtonElement) ||
    !emptyState ||
    !pagination ||
    !ingredientCount ||
    !ingredientSearchButton ||
    !validationDialog ||
    !validationMessage ||
    !validationDialogButton
  ) {
    throw new Error("Elemen pencarian atau dialog validasi tidak ditemukan.");
  }

  const mainIngredientInput = ingredientSearchForm.elements.namedItem("bahan-utama");
  const additionalIngredientsInput =
    ingredientSearchForm.elements.namedItem("bahan-tambahan");
  const recipeQueryInput = recipeSearchForm.elements.namedItem("resep");

  if (
    !(mainIngredientInput instanceof HTMLInputElement) ||
    !(additionalIngredientsInput instanceof HTMLInputElement) ||
    !(recipeQueryInput instanceof HTMLInputElement)
  ) {
    throw new Error("Elemen input pencarian tidak valid.");
  }

  let currentSearch = null;
  let latestRequestId = 0;
  let latestDetailRequestId = 0;
  let activeRecipe = null;
  let activeAvailableIngredients = [];
  let previousScrollPosition = 0;

  function showValidationDialog(message) {
    validationMessage.textContent = message;
    if (!validationDialog.open) {
      validationDialog.showModal();
    }
  }

  function updateIngredientCount() {
    const rawValue = additionalIngredientsInput.value;
    const ingredients = getIngredients(rawValue);
    const additionalIngredientCount = ingredients.length;

    ingredientCount.textContent = `${additionalIngredientCount}/${MAX_INGREDIENTS}`;
    ingredientCount.setAttribute(
      "aria-label",
      `${additionalIngredientCount} dari maksimal ${MAX_INGREDIENTS} bahan tambahan`,
    );
    ingredientSearchButton.disabled = additionalIngredientCount > MAX_INGREDIENTS;

    const isEndingWithComma = /[,;]\s*$/.test(rawValue);
    if ((additionalIngredientCount >= MAX_INGREDIENTS && isEndingWithComma) || additionalIngredientCount > MAX_INGREDIENTS) {
      if (!validationDialog.open) {
        showValidationDialog("Sudah mencapai batas maksimum bahan");
      }
    }

    return additionalIngredientCount;
  }

  async function loadRecipes(search, page = 1) {
    const requestId = ++latestRequestId;
    currentSearch = search;
    emptyState.textContent = "Memuat resep...";
    emptyState.hidden = false;
    recipeGrid.replaceChildren();
    pagination.replaceChildren();
    pagination.hidden = true;

    try {
      let result;
      const selectedFilters = filters.getSelectedFilters();
      const params = { page: String(page) };
      if (search) {
        params.q = search.query;
      }
      if (selectedFilters.length > 0) {
        params.filters = selectedFilters.join(",");
      }

      function setDetailFeedback(message) {
        detailFeedback.textContent = message;
        detailFeedback.hidden = !message;
      }

      function closeRecipeDetail() {
        latestDetailRequestId += 1;
        detailScreen.hidden = true;
        searchPanel.hidden = false;
        recipeContent.hidden = false;
        activeRecipe = null;
        activeAvailableIngredients = [];
        if (stepsScreen) {
        stepsScreen.hidden = true;
        }
        window.scrollTo(0, previousScrollPosition);
      }

      async function openRecipeDetail(card) {
        const recipeId = card.dataset.recipeId;
        if (!recipeId || !/^\d+$/.test(recipeId)) {
          setDetailFeedback("ID resep tidak valid.");
          return;
        }

        const requestId = ++latestDetailRequestId;
        previousScrollPosition = window.scrollY;
        searchPanel.hidden = true;
        recipeContent.hidden = true;
        detailScreen.hidden = false;
        detailTitle.textContent = "Memuat resep...";
        activeRecipe = null;
        activeAvailableIngredients = [];
        document.querySelector("#detail-missing-list")?.replaceChildren();
        document.querySelector("#detail-available-list")?.replaceChildren();
        setDetailFeedback("");
        window.scrollTo(0, 0);

        try {
          const result = await fetchRecipes(`recipes/${recipeId}`);
          if (requestId !== latestDetailRequestId || detailScreen.hidden) {
            return;
          }

          const recipe = result.data;
          if (!recipe || typeof recipe !== "object") {
            throw new Error("Data detail resep tidak tersedia.");
          }

          let availableIngredients = [];
          if (currentSearch?.type === "ingredients") {
            try {
              const matchedIngredients = JSON.parse(card.dataset.availableIngredients || "[]");
              availableIngredients = Array.isArray(matchedIngredients) && matchedIngredients.length
                ? matchedIngredients
                : getIngredients(currentSearch.query);
            } catch (error) {
              throw new Error("Data bahan yang cocok pada resep tidak valid.", { cause: error });
            }
          }

          activeRecipe = recipe;
          activeAvailableIngredients = availableIngredients;
          renderRecipeDetail(recipe, activeAvailableIngredients);
        } catch (error) {
          if (requestId !== latestDetailRequestId) {
            return;
          }
          detailTitle.textContent = "Detail resep tidak tersedia";
          setDetailFeedback(`Gagal memuat detail resep. ${error.message}`);
        }
      }

      let isLikeSubmitting = false;
      async function handleLikeAction() {
        if (!activeRecipe || isLikeSubmitting) return;
        isLikeSubmitting = true;

        try {
          const isSelected = detailLikeButton.getAttribute("aria-pressed") === "true";
          const method = isSelected ? "DELETE" : "POST";

          const response = await fetch(`${API_BASE_URL}/recipes/${activeRecipe.id_resep}/like`, { 
            method,
            headers: { "Content-Type": "application/json" }
          });
          const result = await response.json();
          if (!response.ok || result.status === "error") {
            throw new Error(result.message || "Aksi resep gagal.");
          }

          activeRecipe = { ...activeRecipe, sudah_like: result.sudah_like === true };
          renderRecipeDetail(activeRecipe, activeAvailableIngredients);
          setDetailFeedback("Status suka resep diperbarui.");
        } catch (error) {
          setDetailFeedback(error.message);
        } finally {
          isLikeSubmitting = false;
        }
      }

      let isBookmarkSubmitting = false;
      async function handleBookmarkAction() {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Silakan login terlebih dahulu untuk menyimpan resep!");
          return;
        }

        if (!activeRecipe || isBookmarkSubmitting) return;
        isBookmarkSubmitting = true;

        try {
          const isSelected = detailBookmarkButton.getAttribute("aria-pressed") === "true";
          const method = isSelected ? "DELETE" : "POST";

          const response = await fetch(`${API_BASE_URL}/recipes/${activeRecipe.id_resep}/bookmark`, { 
            method,
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });
          const result = await response.json();
          if (!response.ok || result.status === "error") {
            throw new Error(result.message || "Aksi resep gagal.");
          }

          activeRecipe = { ...activeRecipe, sudah_simpan: result.sudah_simpan === true };
          renderRecipeDetail(activeRecipe, activeAvailableIngredients);
          setDetailFeedback("Status simpan resep diperbarui.");
        } catch (error) {
          setDetailFeedback(error.message);
        } finally {
          isBookmarkSubmitting = false;
        }
      }

      async function copyIngredientList(button) {
        const listId = button.dataset.copyList;
        const list = listId ? document.getElementById(listId) : null;
        if (!(list instanceof HTMLUListElement)) {
          throw new Error("Daftar bahan untuk disalin tidak ditemukan.");
        }

        const text = [...list.querySelectorAll("li")]
          .filter((item) => !item.classList.contains("detail-list-empty"))
          .map((item) => item.textContent.trim())
          .join("\n");
        if (!text) {
          setDetailFeedback("Tidak ada bahan untuk disalin.");
          return;
        }
        if (!navigator.clipboard?.writeText) {
          setDetailFeedback("Fitur salin tidak tersedia di browser ini.");
          return;
        }

        try {
          await navigator.clipboard.writeText(text);
          setDetailFeedback("");
          if (!copySuccessDialog.open) {
            copySuccessDialog.showModal();
          }
        } catch (error) {
          setDetailFeedback(`Daftar bahan tidak dapat disalin. ${error.message}`);
        }
      }

      recipeGrid.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) {
          return;
        }
        const card = event.target.closest(".recipe-card");
        if (card instanceof HTMLElement) {
          void openRecipeDetail(card);
        }
      });

      recipeGrid.addEventListener("keydown", (event) => {
        if (
          !(event.target instanceof HTMLElement) ||
          !event.target.matches(".recipe-card") ||
          (event.key !== "Enter" && event.key !== " ")
        ) {
          return;
        }
        event.preventDefault();
        void openRecipeDetail(event.target);
      });

      detailBackButton.addEventListener("click", closeRecipeDetail);
      
      detailLikeButton.onclick = () => {
        void handleLikeAction();
      };
      detailBookmarkButton.onclick = () => {
        void handleBookmarkAction();
      };

      detailStepsButton.addEventListener("click", () => {
        if (!activeRecipe?.langkah?.length) {
          setDetailFeedback("Langkah memasak belum tersedia untuk resep ini.");
          return;
        }
        stepsDialog.showModal();
      });
      stepsDialogClose.addEventListener("click", () => stepsDialog.close());
      copySuccessClose.addEventListener("click", () => copySuccessDialog.close());
      detailScreen.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) {
          return;
        }
        const copyButton = event.target.closest("[data-copy-list]");
        if (copyButton instanceof HTMLButtonElement) {
          void copyIngredientList(copyButton);
        }
      });

      document.addEventListener("keydown", (event) => {
        if (
          event.key === "Escape" &&
          !detailScreen.hidden &&
          !stepsDialog.open &&
          !copySuccessDialog.open
        ) {
          closeRecipeDetail();
        }
      });

      if (!search) {
        result = await fetchRecipes("most-liked", params);
      } else {
        result = await fetchRecipes(
          search.type === "ingredients" ? "search-bahan" : "search-resep",
          params,
        );
      }

      if (requestId !== latestRequestId) {
        return;
      }

      const recipes = Array.isArray(result.data) ? result.data : [];
      //indikator jumlah bahan yang cocok
      recipes.sort((a, b) => {
      const matchA = (a.hasOwnProperty('bahan_cocok') && Array.isArray(a.bahan_cocok)) ? a.bahan_cocok.length : 0;
      const matchB = (b.hasOwnProperty('bahan_cocok') && Array.isArray(b.bahan_cocok)) ? b.bahan_cocok.length : 0;
      
      // Fallback: Jika tidak ada kecocokan bahan atau jumlahnya sama, urutkan berdasarkan jumlah likes
      if (matchA === matchB) {
        const likeA = a.jumlah_like || 0;
        const likeB = b.jumlah_like || 0;
        return likeB - likeA;
      }
      return matchB - matchA; // Terbesar ke terkecil
    });
  
      recipeGrid.replaceChildren(...recipes.map(createRecipeCard));
      if (recipes.length === 0) {
        emptyState.textContent = "Resep tidak ditemukan.";
        emptyState.hidden = false;
        if (search?.type === "ingredients" && page === 1) {
          showValidationDialog(
            "Kombinasi bahan yang anda masukkan tidak tersedia, mau coba kombinasi bahan lain?",
          );
        } else if (search?.type === "name" && page === 1) {
          showValidationDialog(
            "Resep yang anda masukkan tidak tersedia, mau coba cari resep lain?",
          );
        }
      } else {
        emptyState.hidden = true;
      }
      renderPagination(pagination, page, result.total_halaman || 1, (selectedPage) => {
        void loadRecipes(currentSearch, selectedPage);
      });
    } catch (error) {
      if (requestId !== latestRequestId) {
        return;
      }

      emptyState.textContent = "Resep tidak dapat dimuat.";
      emptyState.hidden = false;
      showValidationDialog(
        `Gagal mengambil resep dari server. ${error.message}`,
      );
    }
  }

  function isSearchingByBothMethods() {
    return Boolean(
      (mainIngredientInput.value.trim() || additionalIngredientsInput.value.trim()) &&
        recipeQueryInput.value.trim(),
    );
  }

  function showSearchMethodValidation() {
    if (!isSearchingByBothMethods()) {
      return false;
    }
    showValidationDialog(
      "Harap pilih salah satu metode pencarian (melalui input bahan atau pencarian resep langsung)",
    );
    return true;
  }

  validationDialogButton.addEventListener("click", () => {
    validationDialog.close();
  });

  mainIngredientInput.addEventListener("input", () => {
    updateIngredientCount();
    const val = mainIngredientInput.value;
    // VALIDASI BARU: Jika di input bahan utama ada tanda koma, langsung trigger error
    if (val.includes(",")) {
      showValidationDialog("Bahan utama tidak boleh mengandung tanda koma!");
    } else if (getIngredients(val).length > 1) {
      showValidationDialog(
        "Bahan utama hanya boleh diisi satu jenis bahan saja, masukkan bahan lainnya di kolom bahan tambahan",
      );
    }
  });

  additionalIngredientsInput.addEventListener("input", () => {
    updateIngredientCount();
    const val = additionalIngredientsInput.value;
    // VALIDASI TAMBAHAN: Jika user mengetik tanda koma di awal atau format salah
    if (val.startsWith(",")) {
      showValidationDialog("Format penulisan bahan tambahan tidak valid (tidak boleh diawali koma)");
    }
  });

  updateIngredientCount();

  recipeQueryInput.addEventListener("input", () => {
    if (getIngredients(recipeQueryInput.value).length > 1) {
      showValidationDialog("Masukkan hanya 1 nama resep");
    }
  });

  recipeSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (showSearchMethodValidation()) {
      return;
    }

    const recipeName = recipeQueryInput.value.trim();
    if (!recipeName) {
      showValidationDialog("Harap masukkan nama resep yang ingin dicari");
      recipeQueryInput.focus();
      return;
    }

    if (getIngredients(recipeName).length > 1) {
      showValidationDialog("Masukkan hanya 1 nama resep");
      return;
    }

    void loadRecipes({ type: "name", query: recipeName });
  });

  ingredientSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const mainVal = mainIngredientInput.value;
    if (mainVal.includes(",")) {
      showValidationDialog("Bahan utama tidak boleh mengandung tanda koma!");
      return;
    }

    const ingredientTotal = updateIngredientCount();
    if (ingredientTotal > MAX_INGREDIENTS) {
      showValidationDialog("Sudah mencapai batas maksimum bahan");
      return;
    }

    if (showSearchMethodValidation()) {
      return;
    }

    const mainIngredients = getIngredients(mainIngredientInput.value);
    const additionalIngredients = getIngredients(additionalIngredientsInput.value);

    if (additionalIngredients.length > 0 && mainIngredients.length === 0) {
      showValidationDialog(
        "Harap isi bahan utama terlebih dahulu sebelum memasukkan bahan tambahan",
      );
      return;
    }

    if (mainIngredients.length === 0) {
      showValidationDialog("Harap masukkan minimal bahan utama untuk mencari resep");
      return;
    }

    const ingredients = [...mainIngredients, ...additionalIngredients];
    void loadRecipes({ type: "ingredients", query: ingredients.join(",") });
  });

  const filters = initFilters(() => {
    void loadRecipes(currentSearch);
  });

  void loadRecipes(null);
}