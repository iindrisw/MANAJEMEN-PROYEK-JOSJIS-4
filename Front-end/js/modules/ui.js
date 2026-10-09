import { switchView } from './navigation.js';

const modal = document.getElementById('customModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalCloseBtn = document.getElementById('modalCloseBtn');

export function showCustomModal(content, title = "Pemberitahuan", isHtml = false) {
  if (modal && modalTitle && modalMessage) {
    modalTitle.textContent = title;
    if (isHtml) {
      modalMessage.innerHTML = content;
    } else {
      modalMessage.textContent = content;
    }
    modal.classList.remove('hidden');
  }
}

export function hideCustomModal() {
  if (modal) modal.classList.add('hidden');
}

if (modalCloseBtn) modalCloseBtn.addEventListener('click', hideCustomModal);
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideCustomModal();
  });
}

export function tampilkanDetailResep(resep) {
  const viewDetailResep = document.getElementById('viewDetailResep');
  if (!viewDetailResep) return;

  const detailTitle = viewDetailResep.querySelector('.detail-title');
  const detailListTerpakai = viewDetailResep.querySelector('.detail-section:nth-of-type(1) .detail-list');
  const detailListMissing = viewDetailResep.querySelector('.detail-list.missing');

  if (detailTitle) detailTitle.textContent = resep.nama_resep || 'Detail Resep';

  if (detailListTerpakai) {
    detailListTerpakai.innerHTML = '';
    const bahanTerpakai = resep.bahan_terpakai || [];
    if (bahanTerpakai.length > 0) {
      bahanTerpakai.forEach(b => {
        const namaBahan = typeof b === 'object' ? b.nama_bahan : b;
        detailListTerpakai.innerHTML += `<li><i class="fa-solid fa-square-check"></i> <span>${String(namaBahan).toUpperCase()}</span></li>`;
      });
    } else {
      detailListTerpakai.innerHTML = '<li><span>-</span></li>';
    }
  }

  if (detailListMissing) {
    detailListMissing.innerHTML = '';
    const bahanMissing = resep.bahan_tidak_tersedia || resep.bahan_missing || [];
    if (bahanMissing.length > 0) {
      bahanMissing.forEach(b => {
        const namaBahan = typeof b === 'object' ? b.nama_bahan : b;
        detailListMissing.innerHTML += `<li><i class="fa-regular fa-square"></i> <span>${String(namaBahan).toUpperCase()}</span></li>`;
      });
    } else {
      detailListMissing.innerHTML = '<li><span>Semua bahan tersedia</span></li>';
    }
  }

  switchView('detailResep');
}

export function renderBackendRecipesPage(recipes, page = 1, itemsPerPage = 6, onPageChange) {
  const recipeListContainer = document.getElementById('recipeList');
  if (!recipeListContainer) return;

  recipeListContainer.innerHTML = '';
  const startIndex = (page - 1) * itemsPerPage;
  const pageRecipes = recipes.slice(startIndex, startIndex + itemsPerPage);

  pageRecipes.forEach((resep) => {
    const card = document.createElement('article');
    card.className = 'recipe-card-compact';

    let bahanListHtml = '';
    if (resep.bahan_terpakai && resep.bahan_terpakai.length > 0) {
      resep.bahan_terpakai.forEach(b => {
        const namaBahan = typeof b === 'object' ? b.nama_bahan : b;
        bahanListHtml += `<li>${String(namaBahan).toUpperCase()}</li>`;
      });
    } else {
      bahanListHtml = `<li>-</li>`;
    }

    const likesCount = resep.jumlah_like || 25262;

    card.innerHTML = `
      <header class="card-header">
        <h2>${resep.nama_resep}</h2>
      </header>
      <div class="card-body">
        <div class="card-subheader">
          <h3>Bahan</h3>
          <span class="like-count"><i class="fa-solid fa-heart"></i> ${likesCount}</span>
        </div>
        <ol class="ingredient-num-list">
          ${bahanListHtml}
        </ol>
      </div>
    `;

    card.addEventListener('click', () => tampilkanDetailResep(resep));
    recipeListContainer.appendChild(card);
  });

  renderPaginationUI(recipes.length, page, itemsPerPage, onPageChange);
}

export function renderPaginationUI(totalItems, currentPage, itemsPerPage, onPageChange) {
  const paginationBox = document.querySelector('.pagination-box');
  if (!paginationBox) return;

  paginationBox.innerHTML = '';
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    paginationBox.style.display = 'none';
    return;
  }

  paginationBox.style.display = 'flex';
  const maxVisibleButtons = Math.min(totalPages, 3);

  for (let i = 1; i <= maxVisibleButtons; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.type = 'button';
    pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => onPageChange(i));
    paginationBox.appendChild(pageBtn);
  }

  if (totalPages > 3) {
    const dotsSpan = document.createElement('span');
    dotsSpan.className = 'page-dots';
    dotsSpan.textContent = '...';
    paginationBox.appendChild(dotsSpan);
  }
}

export function renderModalRecipesPage(recipes, page = 1, itemsPerPage = 4, onPageChange) {
  const scrollContainer = document.querySelector('.resep-scroll-container');
  const modalCariMenu = document.getElementById('modalCariMenu');
  if (!scrollContainer) return;

  scrollContainer.innerHTML = '';

  if (!recipes || recipes.length === 0) {
    scrollContainer.innerHTML = `<p style="text-align:center; padding:20px; font-weight:800; font-size:12px; color:#D05755;">Belum ada resep yang ditemukan.</p>`;
    return;
  }

  const startIndex = (page - 1) * itemsPerPage;
  const pageRecipes = recipes.slice(startIndex, startIndex + itemsPerPage);

  pageRecipes.forEach((resep) => {
    let bahanChecklistHtml = '';
    if (resep.bahan_terpakai && resep.bahan_terpakai.length > 0) {
      resep.bahan_terpakai.forEach(b => {
        const namaBahan = typeof b === 'object' ? b.nama_bahan : b;
        bahanChecklistHtml += `<div class="bahan-check"><i class="fa-regular fa-square-check"></i> ${String(namaBahan).toUpperCase()}</div>`;
      });
    }

    const article = document.createElement('article');
    article.className = 'item-resep-card';
    article.style.cursor = 'pointer';
    article.innerHTML = `
      <div class="item-resep-title">${resep.nama_resep}</div>
      <div class="item-resep-body">
        <div class="label-bahan-terpakai">Bahan<br>Terpakai</div>
        <div class="grid-bahan">${bahanChecklistHtml}</div>
      </div>
    `;

    article.addEventListener('click', () => {
      if (modalCariMenu) modalCariMenu.classList.add('hidden');
      tampilkanDetailResep(resep);
    });

    scrollContainer.appendChild(article);
  });
}