const LEADING_UNIT_PATTERN =
  /^(?:\d+(?:[.,/]\d+)?\s*)?(?:gram|grams|gr|g|kg|mg|ml|l|liter|sdt|sdm|sendok\s+teh|sendok\s+makan|buah|butir|siung|lembar|batang|potong|biji|bungkus|pack|kaleng|gelas|cup|ons|ikat)\b[\s\-:.)]*/i;

function formatPreviewIngredient(ingredient) {
  if (!ingredient || typeof ingredient !== "object") {
    return String(ingredient || "Bahan").trim();
  }

  let text = String(
    ingredient.nama_bahan ??
      ingredient.nama ??
      ingredient.bahan ??
      "",
  ).trim();

  if (!text) {
    text = String(
      ingredient.jumlah ??
        ingredient.takaran ??
        ingredient.kuantitas ??
        "",
    ).trim();
  }

  // Bersihkan angka takaran di depan dan awalan satuan seperti "gram", "gr", "sdm", dll.
  while (text) {
    const cleaned = text.replace(LEADING_UNIT_PATTERN, "").trim();
    if (cleaned === text) {
      break;
    }
    text = cleaned;
  }

  // Jika setelah dibersihkan masih diawali angka/pecahan takaran, buang bagian depannya
  text = text.replace(/^\d+(?:[.,/]\d+)?\s*/, "").trim();

  return text || "Bahan";
}

export function createRecipeCard(
  recipe,
  { searchedIngredientCount } = {},
) {
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
    .map((ingredient) => formatPreviewIngredient(ingredient))
    .join(" ")
    .toLocaleLowerCase("id");
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Lihat detail resep ${name}`);

  // 1. Judul Resep
  const title = document.createElement("h2");
  const titleText = document.createElement("span");
  titleText.textContent = name;
  title.append(titleText);

  // 2. Container Meta (Bahan, Like, Badge Ketersediaan)
  const meta = document.createElement("div");
  meta.className = "recipe-meta";

  // Bagian Daftar Bahan
  const ingredientSection = document.createElement("div");
  ingredientSection.className = "recipe-ingredients";
  const ingredientList = document.createElement("ol");
  const mainIngredients = ingredients.slice(0, 5);

  for (const ingredient of mainIngredients) {
    const item = document.createElement("li");
    item.textContent = formatPreviewIngredient(ingredient);
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

  meta.append(ingredientSection, likes);

  if (Number.isInteger(searchedIngredientCount) && searchedIngredientCount > 0) {
    card.classList.add("has-availability");
    const matchedIngredients = Array.isArray(recipe.bahan_cocok)
      ? recipe.bahan_cocok
      : [];
    const availableCount = matchedIngredients.length > 0
      ? matchedIngredients.length
      : Math.max(0, Number(recipe.jumlah_cocok) || 0);
    const denominator = searchedIngredientCount;
    const matchedCount = Math.min(availableCount, denominator);
    const availability = document.createElement("span");
    availability.className = "recipe-availability";
    availability.textContent = `${matchedCount}/${denominator} bahan tersedia`;
    availability.setAttribute(
      "aria-label",
      `${matchedCount} dari ${denominator} bahan tersedia`,
    );
    meta.append(availability);
  }

  card.append(title, meta);
  return card;
}

export function renderPagination(
  container,
  page,
  totalPages,
  onPageSelect,
  maxPageNumber,
  showSinglePage = false,
) {
  container.replaceChildren();
  totalPages = Math.max(1, Number(totalPages) || 1);
  container.hidden = totalPages <= 1 && !showSinglePage;

  if (Number.isInteger(maxPageNumber) && maxPageNumber > 0) {
    const lastPage = Math.min(totalPages, maxPageNumber);
    for (let pageNumber = 1; pageNumber <= lastPage; pageNumber += 1) {
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
    return;
  }

  const visiblePageCount = 5;
  const firstPage = Math.max(
    1,
    Math.min(page - Math.floor(visiblePageCount / 2), totalPages - visiblePageCount + 1),
  );
  const lastPage = Math.min(totalPages, firstPage + visiblePageCount - 1);

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
}