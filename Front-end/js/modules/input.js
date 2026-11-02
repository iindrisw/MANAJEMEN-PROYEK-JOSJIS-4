import { createRecipeCard, renderPagination } from "./recipe-view.js";
import { renderRecipeDetail } from "./recipe-detail.js";
import { initFilters } from "./filters.js";

const MAX_ADDITIONAL_INGREDIENTS = 5;
const MAX_TOTAL_INGREDIENTS = 6;
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

  const token = localStorage.getItem("token");
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
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
  const stepsLikeButton = document.querySelector("#steps-like");
  const detailStepsButton = document.querySelector("#detail-steps");
  const stepsDialog = document.querySelector("#recipe-steps-screen");
  const copySuccessDialog = document.querySelector("#copy-success-dialog");
  const copySuccessClose = document.querySelector("#copy-success-close");
  const emptyState = document.querySelector("#empty-state");
  const pagination = document.querySelector(".pagination");
  const ingredientCount = document.querySelector("#ingredient-count");
  const filterButton = document.querySelector("#filter-button");
  const ingredientSearchButton = ingredientSearchForm?.querySelector(
    'button[type="submit"]',
  );
  const validationDialog = document.querySelector("#validation-dialog");
  const validationMessage = document.querySelector("#validation-message");
  const validationDialogButton = validationDialog?.querySelector("button");
  const bookmarkUnavailableDialog = document.querySelector(
    "#bookmark-unavailable-dialog",
  );
  const bookmarkUnavailableClose = document.querySelector(
    "#bookmark-unavailable-close",
  );
  const bookmarkSuccessDialog = document.querySelector(
    "#bookmark-success-dialog",
  );
  const bookmarkSuccessClose = document.querySelector(
    "#bookmark-success-close",
  );

  if (
    !(recipeSearchForm instanceof HTMLFormElement) ||
    !(ingredientSearchForm instanceof HTMLFormElement) ||
    !(recipeGrid instanceof HTMLElement) ||
    !(searchPanel instanceof HTMLElement) ||
    !(recipeContent instanceof HTMLElement) ||
    !(detailScreen instanceof HTMLElement) ||
    !(detailTitle instanceof HTMLElement) ||
    !(detailFeedback instanceof HTMLElement) ||
    !(detailBackButton instanceof HTMLButtonElement) ||
    !(detailLikeButton instanceof HTMLButtonElement) ||
    !(detailBookmarkButton instanceof HTMLButtonElement) ||
    !(stepsLikeButton instanceof HTMLButtonElement) ||
    !(detailStepsButton instanceof HTMLButtonElement) ||
    !(stepsDialog instanceof HTMLElement) ||
    !(copySuccessDialog instanceof HTMLDialogElement) ||
    !(copySuccessClose instanceof HTMLButtonElement) ||
    !(emptyState instanceof HTMLElement) ||
    !(pagination instanceof HTMLElement) ||
    !(ingredientCount instanceof HTMLElement) ||
    !(filterButton instanceof HTMLButtonElement) ||
    !(ingredientSearchButton instanceof HTMLButtonElement) ||
    !(validationDialog instanceof HTMLDialogElement) ||
    !(validationMessage instanceof HTMLElement) ||
    !(validationDialogButton instanceof HTMLButtonElement) ||
    !(bookmarkUnavailableDialog instanceof HTMLDialogElement) ||
    !(bookmarkUnavailableClose instanceof HTMLButtonElement) ||
    !(bookmarkSuccessDialog instanceof HTMLDialogElement) ||
    !(bookmarkSuccessClose instanceof HTMLButtonElement)
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
  let submittedSearchValues = null;
  let latestRequestId = 0;
  let latestDetailRequestId = 0;
  let activeRecipe = null;
  let activeAvailableIngredients = [];
  let isSavedViewActive = false;
  let previousAdditionalSeparatorCount = 0;
  let previousScrollPosition = 0;
  let isCopyingMissingList = false;
  let lastMissingListCopyAt = 0;

  function getCurrentSearchValues() {
    return {
      mainIngredient: mainIngredientInput.value.trim(),
      additionalIngredients: additionalIngredientsInput.value.trim(),
      recipeQuery: recipeQueryInput.value.trim(),
    };
  }

  function updateFilterButtonState() {
    const currentValues = getCurrentSearchValues();
    const hasUnsubmittedInput =
      Object.values(currentValues).some(Boolean) &&
      (!submittedSearchValues ||
        Object.keys(currentValues).some(
          (key) => currentValues[key] !== submittedSearchValues[key],
        ));
    filterButton.disabled = hasUnsubmittedInput;
  }

  function showValidationDialog(message) {
    validationMessage.textContent = message;
    if (!validationDialog.open) {
      validationDialog.showModal();
    }
  }

  validationDialogButton.addEventListener("click", () => {
    validationDialog.close();
  });
  copySuccessClose.addEventListener("click", () => copySuccessDialog.close());
  bookmarkUnavailableClose.addEventListener("click", () =>
    bookmarkUnavailableDialog.close(),
  );
  bookmarkSuccessClose.addEventListener("click", () =>
    bookmarkSuccessDialog.close(),
  );

  function applyAnonymousLikeState(recipe) {
    const isLiked =
      localStorage.getItem(`anonymous-recipe-like-${recipe.id_resep}`) === "true";
    const serverIsLiked = recipe.sudah_like === true;
    const likeAdjustment = Number(isLiked) - Number(serverIsLiked);

    return {
      ...recipe,
      sudah_like: isLiked,
      jumlah_like: Math.max(
        0,
        (Number(recipe.jumlah_like) || 0) + likeAdjustment,
      ),
    };
  }

  function updateRecipeCardLikeCount(recipe) {
    const card = [...recipeGrid.querySelectorAll(".recipe-card")].find(
      (item) => item.dataset.recipeId === String(recipe.id_resep),
    );
    const countLabel = card?.querySelector(".recipe-likes .like-count");
    const likeBadge = card?.querySelector(".recipe-likes");
    if (!countLabel || !likeBadge) {
      return;
    }
    const count = Number(recipe.jumlah_like) || 0;
    countLabel.textContent = String(count);
    likeBadge.setAttribute("aria-label", `${count} suka`);
  }

  function updateIngredientCount({ notifyLimit = false } = {}) {
    const rawValue = additionalIngredientsInput.value;
    const ingredients = getIngredients(rawValue);
    const additionalIngredientCount = ingredients.length;
    const separatorCount = (rawValue.match(/[,;\n]/g) || []).length;

    ingredientCount.textContent = `${additionalIngredientCount}/${MAX_ADDITIONAL_INGREDIENTS}`;
    ingredientCount.setAttribute(
      "aria-label",
      `${additionalIngredientCount} dari maksimal ${MAX_ADDITIONAL_INGREDIENTS} bahan tambahan`,
    );
    ingredientSearchButton.disabled =
      additionalIngredientCount > MAX_ADDITIONAL_INGREDIENTS ||
      getIngredients(mainIngredientInput.value).length + additionalIngredientCount >
        MAX_TOTAL_INGREDIENTS;

    if (
      notifyLimit &&
      previousAdditionalSeparatorCount < MAX_ADDITIONAL_INGREDIENTS &&
      separatorCount >= MAX_ADDITIONAL_INGREDIENTS &&
      !validationDialog.open
    ) {
      showValidationDialog("Sudah mencapai batas maksimum bahan");
    }
    previousAdditionalSeparatorCount = separatorCount;

    return additionalIngredientCount;
  }

  function setDetailFeedback(message) {
    detailFeedback.textContent = message;
    detailFeedback.hidden = !message;
  }

  function closeRecipeDetail() {
    const shouldRefreshMostLiked = currentSearch === null && !isSavedViewActive;
    latestDetailRequestId += 1;
    detailScreen.hidden = true;
    searchPanel.hidden = false;
    recipeContent.hidden = isSavedViewActive;
    const savedScreen = document.querySelector("#view-saved");
    if (savedScreen instanceof HTMLElement) {
      savedScreen.hidden = !isSavedViewActive;
    }
    activeRecipe = null;
    activeAvailableIngredients = [];
    if (stepsDialog && !stepsDialog.hidden) {
      stepsDialog.hidden = true;
    }
    window.scrollTo(0, previousScrollPosition);
    if (shouldRefreshMostLiked) {
      void loadRecipes(null);
    }
    if (isSavedViewActive) {
      window.dispatchEvent(new Event("recipe:saved-refresh"));
    }
  }

  window.addEventListener("recipe:navigate-home", () => {
    isSavedViewActive = false;
    const stepsScreen = document.querySelector("#recipe-steps-screen");
    const cookingModeScreen = document.querySelector("#cooking-mode-screen");
    if (stepsScreen instanceof HTMLElement) {
      stepsScreen.hidden = true;
    }
    if (cookingModeScreen instanceof HTMLElement) {
      cookingModeScreen.hidden = true;
    }
    currentSearch = null;
    filters.reset();
    closeRecipeDetail();
  });

  window.addEventListener("recipe:navigate-saved", () => {
    isSavedViewActive = true;
    currentSearch = null;
    const stepsScreen = document.querySelector("#recipe-steps-screen");
    const cookingModeScreen = document.querySelector("#cooking-mode-screen");
    if (stepsScreen instanceof HTMLElement) {
      stepsScreen.hidden = true;
    }
    if (cookingModeScreen instanceof HTMLElement) {
      cookingModeScreen.hidden = true;
    }
  });

  window.addEventListener("recipe:open-detail-from-saved", (event) => {
    if (!(event instanceof CustomEvent) || !/^\d+$/.test(String(event.detail))) {
      return;
    }
    const savedScreen = document.querySelector("#view-saved");
    if (savedScreen instanceof HTMLElement) {
      savedScreen.hidden = true;
    }
    const card = document.createElement("article");
    card.dataset.recipeId = String(event.detail);
    void openRecipeDetail(card);
  });

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
      if (!localStorage.getItem("token")) {
        Object.assign(recipe, applyAnonymousLikeState(recipe));
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
    if (!activeRecipe || isLikeSubmitting) {
      return;
    }

    isLikeSubmitting = true;
    const previousRecipe = activeRecipe;
    const token = localStorage.getItem("token");
    const wasLiked = previousRecipe.sudah_like === true;
    const isLiked = !wasLiked;
    const recipeId = String(previousRecipe.id_resep);
    const guestLikeKey = `anonymous-recipe-like-${recipeId}`;

    // Update state lokal lebih dulu (Optimistic UI)
    activeRecipe = {
      ...previousRecipe,
      sudah_like: isLiked,
      jumlah_like: Math.max(
        0,
        (Number(previousRecipe.jumlah_like) || 0) + (isLiked ? 1 : -1),
      ),
    };

    if (!token) {
      localStorage.setItem(guestLikeKey, String(isLiked));
    }
    
    renderRecipeDetail(activeRecipe, activeAvailableIngredients);
    updateRecipeCardLikeCount(activeRecipe);

    try {
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Selalu kirim request ke backend seperti codingan Ayes
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/like`, {
        method: isLiked ? "POST" : "DELETE",
        headers: headers,
      });
      const result = await response.json();
      
      if (!response.ok || result.status === "error") {
        throw new Error(result.message || "Aksi resep gagal.");
      }

      activeRecipe = {
        ...activeRecipe,
        sudah_like: result.sudah_like === true,
        jumlah_like: Number(result.jumlah_like) || 0,
      };
      renderRecipeDetail(activeRecipe, activeAvailableIngredients);
      updateRecipeCardLikeCount(activeRecipe);
    } catch (error) {
      // Kembalikan state jika fetch gagal
      activeRecipe = previousRecipe;
      if (!token) {
        localStorage.setItem(guestLikeKey, String(previousRecipe.sudah_like));
      }
      renderRecipeDetail(activeRecipe, activeAvailableIngredients);
      updateRecipeCardLikeCount(activeRecipe);
      setDetailFeedback(error.message);
    } finally {
      isLikeSubmitting = false;
    }
  }

  let isBookmarkSubmitting = false;
  async function handleBookmarkAction() {
    if (!activeRecipe || isBookmarkSubmitting) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      window.dispatchEvent(new Event("recipe:saved-auth-required"));
      return;
    }

    isBookmarkSubmitting = true;
    const wasSaved = activeRecipe.sudah_simpan === true;

    try {
      const response = await fetch(
        `${API_BASE_URL}/recipes/${activeRecipe.id_resep}/bookmark`,
        {
          method: wasSaved ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const result = await response.json();
      if (!response.ok || result.status === "error") {
        if (response.status === 401) {
          localStorage.removeItem("token");
          window.dispatchEvent(new Event("recipe:saved-auth-required"));
          return;
        }
        throw new Error(result.message || "Aksi simpan resep gagal.");
      }

      activeRecipe = {
        ...activeRecipe,
        sudah_simpan: result.sudah_simpan === true,
      };
      renderRecipeDetail(activeRecipe, activeAvailableIngredients);
      if (!wasSaved && activeRecipe.sudah_simpan) {
        bookmarkSuccessDialog.showModal();
      }
    } catch (error) {
      setDetailFeedback(error.message);
    } finally {
      isBookmarkSubmitting = false;
    }
  }

  async function copyIngredientList(button) {
    const listId = button.dataset.copyList;
    const isMissingList = listId === "detail-missing-list";

    if (isMissingList) {
      const now = Date.now();
      if (
        button.disabled ||
        isCopyingMissingList ||
        now - lastMissingListCopyAt < 1000
      ) {
        return;
      }

      isCopyingMissingList = true;
      lastMissingListCopyAt = now;
    }

    try {
      const list = listId ? document.getElementById(listId) : null;
      if (!(list instanceof HTMLUListElement)) {
        throw new Error("Daftar bahan untuk disalin tidak ditemukan.");
      }

      const text = [...list.querySelectorAll("li")]
        .filter((item) => !item.classList.contains("detail-list-empty"))
        .map((item) => item.textContent.trim())
        .filter(Boolean)
        .join("\n");
      if (!text) {
        setDetailFeedback("Tidak ada bahan untuk disalin.");
        return;
      }
      if (!navigator.clipboard?.writeText) {
        setDetailFeedback("Fitur salin tidak tersedia di browser ini.");
        return;
      }

      await navigator.clipboard.writeText(text);
      setDetailFeedback("");
      if (!copySuccessDialog.open) {
        copySuccessDialog.showModal();
      }
    } catch (error) {
      setDetailFeedback(`Daftar bahan tidak dapat disalin. ${error.message}`);
    } finally {
      if (isMissingList) {
        isCopyingMissingList = false;
      }
    }
  }

  async function loadRecipes(search, page = 1) {
    const requestId = ++latestRequestId;
    currentSearch = search;
    emptyState.textContent = "Memuat resep...";
    emptyState.hidden = false;
    recipeGrid.replaceChildren();
    recipeGrid.style.opacity = "0";
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
      const visibleRecipes = localStorage.getItem("token")
        ? recipes
        : recipes.map(applyAnonymousLikeState);
      if (!search && !localStorage.getItem("token")) {
        visibleRecipes.sort(
          (first, second) =>
            (Number(second.jumlah_like) || 0) - (Number(first.jumlah_like) || 0),
        );
      }

      const searchedIngredientCount =
        search?.type === "ingredients"
          ? getIngredients(search.query).length
          : undefined;
      recipeGrid.replaceChildren(
        ...visibleRecipes.map((recipe) =>
          createRecipeCard(recipe, {
            searchedIngredientCount,
            maxIngredientCount: MAX_TOTAL_INGREDIENTS,
          }),
        ),
      );
      requestAnimationFrame(() => {
        recipeGrid.style.opacity = "";
      });
      if (visibleRecipes.length === 0) {
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
      recipeGrid.style.opacity = "";
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

  mainIngredientInput.addEventListener("input", () => {
    updateIngredientCount();
    updateFilterButtonState();
    const val = mainIngredientInput.value;
    if (val.includes(",")) {
      showValidationDialog(
        "Bahan utama hanya boleh diisi satu jenis bahan saja, masukkan bahan lainnya di kolom bahan tambahan",
      );
    }
  });

  additionalIngredientsInput.addEventListener("input", () => {
    updateIngredientCount({ notifyLimit: true });
    updateFilterButtonState();
    const val = additionalIngredientsInput.value;
    if (/^\s*[,;\n]/.test(val)) {
      showValidationDialog("Format penulisan bahan tambahan tidak valid (tidak boleh diawali koma)");
    }
  });

  updateIngredientCount();

  recipeQueryInput.addEventListener("input", () => {
    updateFilterButtonState();
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

    filters.reset();
    submittedSearchValues = getCurrentSearchValues();
    updateFilterButtonState();
    void loadRecipes({ type: "name", query: recipeName });
  });

  ingredientSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const mainVal = mainIngredientInput.value;
    if (mainVal.includes(",")) {
      showValidationDialog("Bahan utama hanya boleh diisi satu jenis bahan saja, masukkan bahan lainnya di kolom bahan tambahan!");
      return;
    }

    const mainIngredients = getIngredients(mainVal);
    if (mainIngredients.length > 1) {
      showValidationDialog(
        "Bahan utama hanya boleh diisi satu jenis bahan saja, masukkan bahan lainnya di kolom bahan tambahan",
      );
      return;
    }

    const ingredientTotal = updateIngredientCount();
    if (ingredientTotal > MAX_ADDITIONAL_INGREDIENTS) {
      showValidationDialog("Sudah mencapai batas maksimum bahan");
      return;
    }

    if (showSearchMethodValidation()) {
      return;
    }

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
    filters.reset();
    submittedSearchValues = getCurrentSearchValues();
    updateFilterButtonState();
    void loadRecipes({ type: "ingredients", query: ingredients.join(",") });
  });

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
  detailLikeButton.addEventListener("click", () => {
    void handleLikeAction();
  });
  detailBookmarkButton.addEventListener("click", () => {
    void handleBookmarkAction();
  });

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
      !copySuccessDialog.open &&
      !bookmarkUnavailableDialog.open &&
      !bookmarkSuccessDialog.open
    ) {
      closeRecipeDetail();
    }
  });

  const filters = initFilters(() => {
    void loadRecipes(currentSearch);
  });

  updateFilterButtonState();
  void loadRecipes(null);
  const recipeIdFromLogin = new URLSearchParams(window.location.search).get("recipe");
  if (recipeIdFromLogin && /^\d+$/.test(recipeIdFromLogin)) {
    history.replaceState(null, "", window.location.pathname);
    const recipeCard = document.createElement("article");
    recipeCard.dataset.recipeId = recipeIdFromLogin;
    void openRecipeDetail(recipeCard);
  }
}