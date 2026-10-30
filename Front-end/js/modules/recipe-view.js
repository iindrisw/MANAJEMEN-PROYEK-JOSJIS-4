export function createRecipeCard(recipe) {
  const card = document.createElement("article");
  const name = recipe.nama_resep || "Resep tanpa nama";
  const ingredients = Array.isArray(recipe.bahan_terpakai)
    ? recipe.bahan_terpakai
    : [];

  card.className = "recipe-card";
  card.dataset.recipeId = String(recipe.id_resep);
  card.dataset.availableIngredients = JSON.stringify(recipe.bahan_cocok || []);
  card.dataset.name = name.toLocaleLowerCase("id");
  card.dataset.ingredients = ingredients
    .map((ingredient) => ingredient.nama_bahan || "")
    .join(" ")
    .toLocaleLowerCase("id");
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Lihat detail resep ${name}`);

  // 1. Judul Resep
  const title = document.createElement("h2");
  title.textContent = name;

  // 2. Container Meta (Bahan, Like, Badge Ketersediaan)
  const meta = document.createElement("div");
  meta.className = "recipe-meta";

  // Bagian Daftar Bahan
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

  // Badge Like
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

  // Masukkan bahan dan likes ke meta secara berurutan sekali saja
  meta.append(ingredientSection, likes);

  // Badge ketersediaan bahan (jika ada hasil pencarian kombinasi)
  if (recipe.hasOwnProperty('bahan_cocok') && Array.isArray(recipe.bahan_cocok)) {
    const matchedIngredients = recipe.bahan_cocok.length;
    const totalIngredients = ingredients.filter(
      (ingredient) => ingredient.is_bumbu_dasar !== true
    ).length;

    const availabilityBadge = document.createElement("span");
    availabilityBadge.className = "recipe-availability";
    availabilityBadge.textContent = `${matchedIngredients}/${totalIngredients < 5 ? totalIngredients : 5} Bahan Tersedia`;
    meta.append(availabilityBadge);
  }

  card.append(title, meta);
  return card;
}

export function renderPagination(container, page, totalPages, onPageSelect) {
  container.replaceChildren();
  container.hidden = totalPages <= 1;
  if (totalPages <= 1) {
    return;
  }

  const visiblePageCount = 5;
  const firstPage = Math.max(
    1,
    Math.min(page - Math.floor(visiblePageCount / 2), totalPages - visiblePageCount + 1),
  );
  const lastPage = Math.min(totalPages, firstPage + visiblePageCount - 1);

  if (firstPage > 1) {
    const more = document.createElement("span");
    more.className = "page-more";
    more.textContent = "...";
    container.append(more);
  }

  for (let pageNumber = firstPage; pageNumber <= lastPage; pageNumber += 1) {
    const button = document.createElement("button");
    button.className = "page-button";
    button.type = "button";
    button.textContent = String(pageNumber);
    if (pageNumber === page) {
      button.classList.add("is-current");
      button.setAttribute("aria-current", "page");
    }
    button.addEventListener("click", () => {
      onPageSelect(pageNumber);
    });
    container.append(button);
  }

  if (lastPage < totalPages) {
    const more = document.createElement("span");
    more.className = "page-more";
    more.textContent = "...";
    container.append(more);
  }
}

export function renderPagination(container, page, totalPages, onPageSelect) {
  container.replaceChildren();
  container.hidden = totalPages <= 1;
  if (totalPages <= 1) {
    return;
  }

  const visiblePageCount = 5;
  const firstPage = Math.max(
    1,
    Math.min(page - Math.floor(visiblePageCount / 2), totalPages - visiblePageCount + 1),
  );
  const lastPage = Math.min(totalPages, firstPage + visiblePageCount - 1);

  if (firstPage > 1) {
    const more = document.createElement("span");
    more.className = "page-more";
    more.textContent = "...";
    container.append(more);
  }

  for (let pageNumber = firstPage; pageNumber <= lastPage; pageNumber += 1) {
    const button = document.createElement("button");
    button.className = "page-button";
    button.type = "button";
    button.textContent = String(pageNumber);
    if (pageNumber === page) {
      button.classList.add("is-current");
      button.setAttribute("aria-current", "page");
    }
    button.addEventListener("click", () => {
      onPageSelect(pageNumber);
    });
    container.append(button);
  }

  if (lastPage < totalPages) {
    const more = document.createElement("span");
    more.className = "page-more";
    more.textContent = "...";
    container.append(more);
  }
}
