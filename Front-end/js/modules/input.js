const MAX_INGREDIENTS = 5;

function getIngredients(value) {
  return value
    .split(/[,;\n]+/)
    .map((ingredient) => ingredient.trim().toLocaleLowerCase("id"))
    .filter(Boolean);
}

export function initInput() {
  const recipeSearchForm = document.querySelector("#recipe-search");
  const ingredientSearchForm = document.querySelector("#ingredient-search");
  const recipeCards = Array.from(document.querySelectorAll(".recipe-card"));
  const emptyState = document.querySelector("#empty-state");
  const filterButton = document.querySelector("#filter-button");
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
    !emptyState ||
    !filterButton ||
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

  function showValidationDialog(message) {
    validationMessage.textContent = message;
    if (!validationDialog.open) {
      validationDialog.showModal();
    }
  }

  function updateIngredientCount() {
    const additionalIngredientCount = getIngredients(
      additionalIngredientsInput.value,
    ).length;

    ingredientCount.textContent = `${additionalIngredientCount} / ${MAX_INGREDIENTS}`;
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

  function displayRecipes(matches) {
    let visibleCount = 0;
    for (const card of recipeCards) {
      const isMatch = matches(card);
      card.hidden = !isMatch;
      if (isMatch) {
        visibleCount += 1;
      }
    }
    emptyState.hidden = visibleCount > 0;
    return visibleCount;
  }

  function restoreRecipes() {
    for (const card of recipeCards) {
      card.hidden = false;
    }
    emptyState.hidden = true;
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

  function filterByRecipeName(recipeName) {
    const normalizedQuery = recipeName.toLocaleLowerCase("id");
    return displayRecipes((card) => {
      const searchableText =
        `${card.dataset.name} ${card.dataset.ingredients}`.toLocaleLowerCase("id");
      return searchableText.includes(normalizedQuery);
    });
  }

  validationDialogButton.addEventListener("click", () => {
    validationDialog.close();
  });

  mainIngredientInput.addEventListener("input", updateIngredientCount);
  additionalIngredientsInput.addEventListener("input", updateIngredientCount);
  updateIngredientCount();

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

    filterByRecipeName(recipeName);
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
      showValidationDialog("Harap masukkan minimal satu bahan utama");
      return;
    }

    const ingredients = [...mainIngredients, ...additionalIngredients];
    const matchCount = displayRecipes((card) => {
      const searchableText =
        `${card.dataset.name} ${card.dataset.ingredients}`.toLocaleLowerCase("id");
      return ingredients.every((ingredient) => searchableText.includes(ingredient));
    });

    if (matchCount === 0) {
      restoreRecipes();
      showValidationDialog(
        "Kombinasi bahan yang anda masukkan tidak tersedia, mau coba kombinasi bahan lain?",
      );
    }
  });

  filterButton.addEventListener("click", () => {
    const isFiltered = filterButton.getAttribute("aria-pressed") === "true";
    filterButton.setAttribute("aria-pressed", String(!isFiltered));
    filterButton.classList.toggle("is-selected", !isFiltered);
  });

  for (const pageButton of document.querySelectorAll(".page-button")) {
    pageButton.addEventListener("click", () => {
      document.querySelector(".page-button.is-current")?.classList.remove("is-current");
      document.querySelector(".page-button[aria-current]")?.removeAttribute("aria-current");
      pageButton.classList.add("is-current");
      pageButton.setAttribute("aria-current", "page");
    });
  }
}