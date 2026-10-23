const MAX_INGREDIENTS = 5;
const API_BASE_URL = "http://127.0.0.1:5000/api";

function getIngredients(value) {
  return value
    .split(/[,;\n]+/)
    .map((ingredient) => ingredient.trim().toLocaleLowerCase("id"))
    .filter(Boolean);
}


// Fungsi untuk mengambil resep dari server
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
  const emptyState = document.querySelector("#empty-state");
  const pagination = document.querySelector(".pagination");
  const filterButton = document.querySelector("#filter-button");
  const filterPanel = document.querySelector("#filter-panel");
  const closeFilterButton = document.querySelector("#filter-close-button");
  const applyFilterButton = document.querySelector("#filter-apply-button");
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
    !emptyState ||
    !pagination ||
    !filterButton ||
    !filterPanel ||
    !closeFilterButton ||
    !applyFilterButton ||
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
  let appliedFilters = [];
  let filterPanelCloseTimer;

  function showValidationDialog(message) {
    validationMessage.textContent = message;
    if (!validationDialog.open) {
      validationDialog.showModal();
    }
  }

  function getSelectedFilters() {
    return [...filterPanel.querySelectorAll('input[type="checkbox"]:checked')].map(
      (input) => input.value,
    );
  }

  function updateApplyFilterButton() {
    const hasSelectedFilters = getSelectedFilters().length > 0;
    const canClearAppliedFilters = appliedFilters.length > 0;
    applyFilterButton.disabled = !hasSelectedFilters && !canClearAppliedFilters;
  }

  function setFilterPanelOpen(isOpen) {
    window.clearTimeout(filterPanelCloseTimer);
    filterButton.setAttribute("aria-expanded", String(isOpen));
    filterButton.classList.toggle("is-selected", isOpen);

    if (isOpen) {
      filterPanel.hidden = false;
      filterPanel.classList.remove("is-closing");
      window.requestAnimationFrame(() => {
        if (filterButton.getAttribute("aria-expanded") === "true") {
          filterPanel.classList.add("is-open");
        }
      });
      return;
    }

    filterPanel.classList.remove("is-open");
    filterPanel.classList.add("is-closing");
    filterPanelCloseTimer = window.setTimeout(() => {
      if (filterButton.getAttribute("aria-expanded") === "false") {
        filterPanel.hidden = true;
        filterPanel.classList.remove("is-closing");
      }
    }, 180);
  }

  function updateIngredientCount() {
    const additionalIngredientCount = getIngredients(
      additionalIngredientsInput.value,
    ).length;

    ingredientCount.textContent = `${additionalIngredientCount}/${MAX_INGREDIENTS}`;
    ingredientCount.setAttribute(
      "aria-label",
      `${additionalIngredientCount} dari maksimal ${MAX_INGREDIENTS} bahan tambahan`,
    );
    ingredientSearchButton.disabled = additionalIngredientCount > MAX_INGREDIENTS;

    if (additionalIngredientCount > MAX_INGREDIENTS && !validationDialog.open) {
      showValidationDialog("Sudah mencapai batas maksimum bahan");
    }
    return additionalIngredientCount;
  }

//card resep  
  function createRecipeCard(recipe) {
    const card = document.createElement("article");
    const name = recipe.nama_resep || "Resep tanpa nama";
    const ingredients = Array.isArray(recipe.bahan_terpakai)
      ? recipe.bahan_terpakai
      : [];
    card.className = "recipe-card";
    card.dataset.name = name.toLocaleLowerCase("id");
    card.dataset.ingredients = ingredients
      .map((ingredient) => ingredient.nama_bahan || "")
      .join(" ")
      .toLocaleLowerCase("id");

    const title = document.createElement("h2");
    title.textContent = name;

    const meta = document.createElement("div");
    meta.className = "recipe-meta";

    const ingredientSection = document.createElement("div");
    const ingredientList = document.createElement("ol");
    const mainIngredients = ingredients
      .filter((ingredient) => ingredient.is_bumbu_dasar !== true)
      .slice(0, 5);
    for (const ingredient of mainIngredients) {
      const item = document.createElement("li");
      const ingredientName = ingredient.nama_bahan || "Bahan";
      item.textContent = ingredientName;
      ingredientList.append(item);
    }
    ingredientSection.append(ingredientList);

    const likes = document.createElement("span");
    likes.className = "recipe-likes";
    const likeCount = recipe.jumlah_like ?? 0;
    likes.setAttribute("aria-label", `${likeCount} suka`);
    const likeIcon = document.createElement("span");
    likeIcon.className = "like-icon";
    likeIcon.setAttribute("aria-hidden", "true");
    const likeImage = document.createElement("img");
    likeImage.src = "assets/figma/heart-like.png";
    likeImage.alt = "";
    likeIcon.append(likeImage);
    const likeCountLabel = document.createElement("span");
    likeCountLabel.className = "like-count";
    likeCountLabel.textContent = String(likeCount);
    likes.append(likeIcon, likeCountLabel);
    meta.append(ingredientSection, likes);
    card.append(title, meta);
    return card;
  }


        //Page Button//
  function renderPagination(page, totalPages) {
    pagination.replaceChildren();
    pagination.hidden = totalPages <= 1;
    if (totalPages <= 1) {
      return;
    }

    const visiblePageCount = Math.min(5, totalPages);
    const firstVisiblePage = Math.min(
      Math.max(1, page - Math.floor(visiblePageCount / 2)),
      totalPages - visiblePageCount + 1,
    );

    for (
      let pageNumber = firstVisiblePage;
      pageNumber < firstVisiblePage + visiblePageCount;
      pageNumber += 1
    ) {
      const button = document.createElement("button");
      button.className = "page-button";
      button.type = "button";
      button.textContent = String(pageNumber);
      if (pageNumber === page) {
        button.classList.add("is-current");
        button.setAttribute("aria-current", "page");
      }
      button.addEventListener("click", () => {
        void loadRecipes(currentSearch, pageNumber);
      });
      pagination.append(button);
    }
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
      const params = { page: String(page) };
      if (search) {
        params.q = search.query;
      }
      if (appliedFilters.length > 0) {
        params.filters = appliedFilters.join(",");
      }

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
      renderPagination(page, result.total_halaman || 1);
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
    if (getIngredients(mainIngredientInput.value).length > 1) {
      showValidationDialog(
        "Bahan utama hanya boleh diisi satu jenis bahan saja, masukkan bahan lainnya di kolom bahan tambahan",
      );
    }
  });
  additionalIngredientsInput.addEventListener("input", updateIngredientCount);
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

  filterButton.addEventListener("click", () => {
    const isOpen = filterButton.getAttribute("aria-expanded") === "true";
    setFilterPanelOpen(!isOpen);
  });

  closeFilterButton.addEventListener("click", () => {
    setFilterPanelOpen(false);
  });

  filterPanel.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement && event.target.type === "checkbox") {
      updateApplyFilterButton();
    }
  });

  applyFilterButton.addEventListener("click", () => {
    appliedFilters = getSelectedFilters();
    updateApplyFilterButton();
    setFilterPanelOpen(false);
    void loadRecipes(currentSearch);
  });

  updateApplyFilterButton();
  void loadRecipes(null);
}