import { setupLangkahMemasak } from "./langkah-memasak.js";

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
  setupLangkahMemasak(recipe, detailScreen, feedback);


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

  // --- LIKE: INTERAKTIF DENGAN OPTIMISTIC UI & LOCAL STORAGE ---
  let isLikeSubmitting = false;
  
  // Ambil status like awal dari Local Storage perangkat (jika pernah disukai sebelumnya)
  const storageKey = `recipe_liked_${recipe.id_resep}`;
  const isLocalStorageLiked = localStorage.getItem(storageKey) === "true";
  
  // Tentukan status awal berdasarkan API atau Local Storage
  const isCurrentlyLiked = recipe.sudah_like === true || isLocalStorageLiked;
  
  likeButton.setAttribute("aria-pressed", String(isCurrentlyLiked));
  likeButton.setAttribute("aria-label", isCurrentlyLiked ? "Batal sukai resep" : "Sukai resep");
  likeButton.classList.toggle("is-active", isCurrentlyLiked);

  likeButton.onclick = async () => {
    if (isLikeSubmitting) return;
    isLikeSubmitting = true;

    // 1. Simpan state sebelumnya untuk rollback jika API gagal
    const wasSelected = likeButton.getAttribute("aria-pressed") === "true";
    const newSelectedState = !wasSelected;

    // 2. Terapkan Optimistic UI Update secara instan di layar
    likeButton.setAttribute("aria-pressed", String(newSelectedState));
    likeButton.setAttribute("aria-label", newSelectedState ? "Batal sukai resep" : "Sukai resep");
    likeButton.classList.toggle("is-active", newSelectedState);

    // Simpan ke Local Storage agar tetap merah saat halaman direfresh
    if (newSelectedState) {
      localStorage.setItem(storageKey, "true");
    } else {
      localStorage.removeItem(storageKey);
    }

    try {
      const method = newSelectedState ? "POST" : "DELETE";
      const response = await fetch(`http://127.0.0.1:5000/api/recipes/${recipe.id_resep}/like`, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();
      if (!response.ok || result.status === "error") {
        throw new Error(result.message || "Gagal mengubah status like.");
      }
    } catch (error) {
      console.error("Terjadi kesalahan jaringan, membatalkan perubahan:", error);
      
      // Rollback UI jika gagal di backend
      likeButton.setAttribute("aria-pressed", String(wasSelected));
      likeButton.classList.toggle("is-active", wasSelected);
      if (wasSelected) {
        localStorage.setItem(storageKey, "true");
      } else {
        localStorage.removeItem(storageKey);
      }
      
      alert("Gagal menyambung ke server. Perubahan dibatalkan.");
    } finally {
      isLikeSubmitting = false;
    }
  };

  // --- BOOKMARK / SIMPAN RESEP: DENGAN VALIDASI LOGIN & POP-UP ---
  let isBookmarkSubmitting = false;
  
  // Cek status bookmark awal dari properti resep dari API
  const isBookmarkedInitial = recipe.sudah_simpan === true;
  bookmarkButton.setAttribute("aria-pressed", String(isBookmarkedInitial));
  bookmarkButton.setAttribute("aria-label", isBookmarkedInitial ? "Hapus dari tersimpan" : "Simpan resep");
  bookmarkButton.classList.toggle("is-active", isBookmarkedInitial);

  bookmarkButton.onclick = async () => {
    if (isBookmarkSubmitting) return;

    // Skenario 2: Pengecekan Autentikasi (Apakah user sudah login/memiliki token)
    const token = localStorage.getItem("token"); // Atau "access_token" sesuai sistem login backend Anda
    if (!token) {
      // Tampilkan pop-up peringatan belum login
      showLoginWarningPopup();
      return;
    }

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
      if (!response.ok || result.status === "error") {
        throw new Error(result.message || "Gagal memperbarui status simpan resep.");
      }

      // Skenario 1: Berhasil menyimpan resep
      const newState = !isBookmarked;
      bookmarkButton.setAttribute("aria-pressed", String(newState));
      bookmarkButton.setAttribute("aria-label", newState ? "Hapus dari tersimpan" : "Simpan resep");
      bookmarkButton.classList.toggle("is-active", newState);

      if (newState) {
        showSuccessPopup("Resep berhasil disimpan");
      }
    } catch (error) {
      console.error("Kesalahan jaringan:", error);
      alert(error.message || "Terjadi kesalahan pada sistem.");
    } finally {
      isBookmarkSubmitting = false;
    }
  };

  // Helper untuk menampilkan Pop-up Peringatan Belum Login (Skenario 2, 3, & 4)
  function showLoginWarningPopup() {
    // Hapus pop-up lama jika sudah ada
    document.getElementById("login-warning-dialog")?.remove();

    const dialog = document.createElement("dialog");
    dialog.id = "login-warning-dialog";
    dialog.className = "validation-dialog";
    dialog.innerHTML = `
      <div style="position: relative; padding: 24px 20px; background: var(--cream, #FFFBE9); border-radius: 16px; border: 3px solid #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.2); text-align: center;">
        <button id="close-warning-popup" style="position: absolute; top: 10px; right: 12px; background: transparent; border: 0; font-size: 18px; cursor: pointer; font-weight: bold;">✕</button>
        <p style="margin: 0 0 16px; font-size: 14px; color: var(--charcoal, #333);">Anda belum login. Silakan login terlebih dahulu untuk menyimpan resep.</p>
        <button id="go-to-login" class="button button-primary" style="padding: 8px 16px; border-radius: 10px; border: 0; background: var(--coral, #D05756); color: white; cursor: pointer; font-weight: 600;">Login Sekarang</button>
      </div>
    `;

    document.body.appendChild(dialog);
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    }

    // Skenario 3: Menekan tombol "Login Sekarang" -> diarahkan ke halaman login
    document.getElementById("go-to-login").onclick = () => {
      dialog.close();
      dialog.remove();
      // Arahkan ke halaman login (sesuaikan fungsi switchView atau route login Anda)
      const loginNav = document.getElementById("navAccount") || document.querySelector("[href*='login']");
      if (loginNav) {
        loginNav.click();
      } else {
        window.location.href = "#login" /* atau arahkan ke view login */;
      }
    };

    // Skenario 4: Menekan tombol silang (X) -> menutup pop-up tanpa pindah halaman
    document.getElementById("close-warning-popup").onclick = () => {
      dialog.close();
      dialog.remove();
    };
  }

  // Helper untuk Pop-up Berhasil Disimpan
  function showSuccessPopup(message) {
    document.getElementById("success-popup-dialog")?.remove();

    const dialog = document.createElement("dialog");
    dialog.className = "validation-dialog";
    dialog.innerHTML = `
      <div style="padding: 20px 24px; background: var(--cream, #FFFBE9); border-radius: 16px; border: 3px solid #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.2); text-align: center;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: var(--charcoal, #333);">${message}</p>
      </div>
    `;
    document.body.appendChild(dialog);
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    }
    setTimeout(() => {
      dialog.close();
      dialog.remove();
    }, 2000);
  }

  feedback.hidden = true;
  feedback.textContent = "";
}