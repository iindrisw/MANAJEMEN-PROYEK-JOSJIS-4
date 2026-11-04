import { setupLangkahMemasak } from "./langkah-memasak.js";

function normalizeIngredient(value) {
  return value
    .toLocaleLowerCase("id")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function createIngredientItem(ingredient, index) {
  const item = document.createElement("li");
  const number = document.createElement("span");
  number.textContent = `${index + 1}.`;
  item.append(number, document.createTextNode(ingredient.takaran || ingredient.nama_bahan || "Bahan"));
  if (ingredient.is_bumbu_dasar) {
    const note = document.createElement("span");
    note.className = "detail-ingredient-note";
    note.textContent = " (bumbu dasar)";
    item.append(note);
  }
  return item;
}

function showEmptyMessage(list, message) {
  const item = document.createElement("li");
  item.className = "detail-list-empty";
  item.textContent = message;
  list.replaceChildren(item);
}

function fitTitleFontSize(element, maxSize, minSize) {
  for (let fontSize = maxSize; fontSize >= minSize; fontSize -= 1) {
    element.style.fontSize = `${fontSize}px`;
    if (
      element.scrollHeight <= element.clientHeight + 1 &&
      element.scrollWidth <= element.clientWidth + 1
    ) {
      return;
    }
  }
}

export function renderRecipeDetail(
  recipe,
  availableIngredientNames = [],
) {
  const recipeTitle = document.querySelector("#detail-recipe-title");
  const missingSection = document.querySelector("#detail-missing-section");
  const missingTitle = document.querySelector("#detail-missing-title");
  const missingList = document.querySelector("#detail-missing-list");
  const availableTitle = document.querySelector("#detail-available-title");
  const availableList = document.querySelector("#detail-available-list");
  const likeButton = document.querySelector("#detail-like");
  const bookmarkButton = document.querySelector("#detail-bookmark");
  const stepsList = document.querySelector("#recipe-steps-list");
  const stepsRecipeTitle = document.querySelector("#steps-recipe-title");
  const stepsLikeButton = document.querySelector("#steps-like");
  const feedback = document.querySelector("#detail-feedback");
  const detailScreen = document.querySelector("#recipe-detail");

  if (
    !(recipeTitle instanceof HTMLElement) ||
    !(missingSection instanceof HTMLElement) ||
    !(missingTitle instanceof HTMLElement) ||
    !(missingList instanceof HTMLUListElement) ||
    !(availableTitle instanceof HTMLElement) ||
    !(availableList instanceof HTMLUListElement) ||
    !(likeButton instanceof HTMLButtonElement) ||
    !(bookmarkButton instanceof HTMLButtonElement) ||
    !(stepsList instanceof HTMLOListElement) ||
    !(stepsRecipeTitle instanceof HTMLElement) ||
    !(stepsLikeButton instanceof HTMLButtonElement) ||
    !(feedback instanceof HTMLElement) ||
    !(detailScreen instanceof HTMLElement)
  ) {
    throw new Error("Elemen tampilan detail resep tidak ditemukan.");
  }

  setupLangkahMemasak(recipe, detailScreen);

  const ingredients = Array.isArray(recipe.bahan) ? recipe.bahan : [];
  const normalizedAvailableNames = availableIngredientNames
    .map(normalizeIngredient)
    .filter(Boolean);
  const hasAvailabilityComparison = normalizedAvailableNames.length > 0;
  const isAvailable = (ingredient) => {
    const name = normalizeIngredient(ingredient.nama_bahan || "");
    return normalizedAvailableNames.some(
      (available) => name.includes(available) || available.includes(name),
    );
  };
  const available = hasAvailabilityComparison
    ? ingredients.filter(isAvailable)
    : ingredients;
  const unavailable = hasAvailabilityComparison
    ? ingredients.filter((ingredient) => !isAvailable(ingredient))
    : [];

  recipeTitle.textContent = recipe.nama_resep || "Resep tanpa nama";
  fitTitleFontSize(recipeTitle, 24, 14);
  stepsRecipeTitle.textContent = recipeTitle.textContent;
  missingSection.hidden = !hasAvailabilityComparison;
  missingTitle.textContent = "Bahan tidak tersedia:";
  availableTitle.textContent = hasAvailabilityComparison
    ? "Bahan tersedia:"
    : "Bahan resep:";
  detailScreen.classList.toggle("has-availability", hasAvailabilityComparison);

  if (unavailable.length > 0) {
    missingList.replaceChildren(...unavailable.map(createIngredientItem));
  } else if (hasAvailabilityComparison) {
    showEmptyMessage(missingList, "Semua bahan resep sudah tersedia.");
  } else {
    missingList.replaceChildren();
  }

  if (available.length > 0) {
    availableList.replaceChildren(
      ...available.map((ingredient, index) => createIngredientItem(ingredient, index)),
    );
  } else if (hasAvailabilityComparison) {
    showEmptyMessage(availableList, "Belum ada bahan resep yang tersedia.");
  } else {
    showEmptyMessage(availableList, "Data bahan belum tersedia untuk resep ini.");
  }

  for (const [button, isSelected, selectedLabel, defaultLabel] of [
  [likeButton, recipe.sudah_like === true, "Batal sukai resep", "Sukai resep"],
  [stepsLikeButton, recipe.sudah_like === true, "Batal sukai resep", "Sukai resep"],
  [bookmarkButton, recipe.sudah_simpan === true, "Hapus dari tersimpan", "Simpan resep"],
  ]) {
    button.setAttribute("aria-pressed", String(isSelected));
    button.setAttribute("aria-label", isSelected ? selectedLabel : defaultLabel);
    button.classList.toggle("is-active", isSelected);

    if (button === bookmarkButton) {
      const bookmarkImage = button.querySelector("img");

      if (bookmarkImage) {
        bookmarkImage.src = isSelected
          ? "assets/figma/bookmark-save.svg"
          : "assets/figma/detail-bookmark.svg";
      }
    }
  }
  

  feedback.hidden = true;
  feedback.textContent = "";
}
