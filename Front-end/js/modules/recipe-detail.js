function normalizeIngredient(value) {
  return value
    .toLocaleLowerCase("id")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function createIngredientItem(ingredient) {
  const item = document.createElement("li");
  item.textContent = ingredient.takaran || ingredient.nama_bahan || "Bahan";
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

export function renderRecipeDetail(recipe, availableIngredientNames = []) {
  const recipeTitle = document.querySelector("#detail-recipe-title");
  const missingSection = document.querySelector("#detail-missing-section");
  const missingTitle = document.querySelector("#detail-missing-title");
  const missingList = document.querySelector("#detail-missing-list");
  const availableTitle = document.querySelector("#detail-available-title");
  const availableList = document.querySelector("#detail-available-list");
  const likeButton = document.querySelector("#detail-like");
  const bookmarkButton = document.querySelector("#detail-bookmark");
  const stepsList = document.querySelector("#recipe-steps-list");
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
    !(feedback instanceof HTMLElement) ||
    !(detailScreen instanceof HTMLElement)
  ) {
    throw new Error("Elemen tampilan detail resep tidak ditemukan.");
  }

  const ingredients = Array.isArray(recipe.bahan) ? recipe.bahan : [];
  const normalizedAvailableNames = availableIngredientNames
    .map(normalizeIngredient)
    .filter(Boolean);
  const hasAvailabilityComparison = normalizedAvailableNames.length > 0;
  detailScreen.classList.toggle("has-availability", hasAvailabilityComparison);
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
  missingSection.hidden = !hasAvailabilityComparison;
  missingTitle.textContent = "Bahan tidak tersedia:";
  availableTitle.textContent = hasAvailabilityComparison
    ? "Bahan tersedia:"
    : "Bahan resep:";

  if (unavailable.length > 0) {
    missingList.replaceChildren(...unavailable.map(createIngredientItem));
  } else if (hasAvailabilityComparison) {
    showEmptyMessage(missingList, "Semua bahan resep sudah tersedia.");
  }

  if (available.length > 0) {
    availableList.replaceChildren(...available.map(createIngredientItem));
  } else if (hasAvailabilityComparison) {
    showEmptyMessage(availableList, "Belum ada bahan resep yang tersedia.");
  } else {
    showEmptyMessage(availableList, "Data bahan belum tersedia untuk resep ini.");
  }

  const steps = Array.isArray(recipe.langkah) ? recipe.langkah : [];
  stepsList.replaceChildren(
    ...steps.map((step) => {
      const item = document.createElement("li");
      item.textContent = typeof step === "string" ? step : step.teks || "";
      return item;
    }),
  );

  for (const [button, isSelected, selectedLabel, defaultLabel] of [
    [likeButton, recipe.sudah_like === true, "Batal sukai resep", "Sukai resep"],
    [bookmarkButton, recipe.sudah_simpan === true, "Hapus dari tersimpan", "Simpan resep"],
  ]) {
    button.setAttribute("aria-pressed", String(isSelected));
    button.setAttribute("aria-label", isSelected ? selectedLabel : defaultLabel);
    button.classList.toggle("is-active", isSelected);
  }

  // --- LIKE: BEBAS TANPA LOGIN ---
  let isLikeSubmitting = false;
  likeButton.onclick = async () => {
    if (isLikeSubmitting) return;
    isLikeSubmitting = true;

    try {
      const isLiked = likeButton.getAttribute("aria-pressed") === "true";
      const method = isLiked ? "DELETE" : "POST";

      const response = await fetch(`http://127.0.0.1:5000/api/recipes/${recipe.id_resep}/like`, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();
      if (response.ok) {
        const newState = !isLiked;
        likeButton.setAttribute("aria-pressed", String(newState));
        likeButton.classList.toggle("is-active", newState);
      } else {
        alert(result.message || "Gagal mengubah status like.");
      }
    } catch (error) {
      console.error("Terjadi kesalahan jaringan:", error);
    } finally {
      isLikeSubmitting = false;
    }
  };

  // --- BOOKMARK: WAJIB LOGIN ---
  let isBookmarkSubmitting = false;
  bookmarkButton.onclick = async () => {
    const token = localStorage.getItem("token"); // Pastikan nama key di localStorage sesuai (misal: "token" atau "access_token")
    if (!token) {
      alert("Silakan login terlebih dahulu untuk menyimpan resep!");
      return;
    }

    if (isBookmarkSubmitting) return;
    isBookmarkSubmitting = true;

    try {
      const isBookmarked = bookmarkButton.getAttribute("aria-pressed") === "true";
      const method = isBookmarked ? "DELETE" : "POST";

      const response = await fetch(`http://127.0.0.1:5000/api/recipes/${recipe.id_resep}/bookmark`, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (response.ok) {
        const newState = !isBookmarked;
        bookmarkButton.setAttribute("aria-pressed", String(newState));
        bookmarkButton.classList.toggle("is-active", newState);
      } else {
        alert(result.message || "Gagal mengubah status bookmark.");
      }
    } catch (error) {
      console.error("Terjadi kesalahan jaringan:", error);
    } finally {
      isBookmarkSubmitting = false;
    }
  };

  feedback.hidden = true;
  feedback.textContent = "";
}