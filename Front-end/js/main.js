import { initNavigation } from './modules/navigation.js';
import { initVoiceRecognition } from './modules/voice.js';
import { initFilterLogic } from './modules/filter.js';
import { initInputCounters } from './modules/input.js';
import { jalankanPencarianBackend, loadInitialRecipesFromBackend, currentRecipeData } from './modules/api.js';
import { renderModalRecipesPage, tampilkanDetailResep } from './modules/ui.js';

function onModalPageChange(newPage) {
  renderModalRecipesPage(currentRecipeData, newPage, 4, onModalPageChange);
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inisialisasi Navigasi & View
  initNavigation();

  // 2. Inisialisasi Voice Input untuk semua input box
  document.querySelectorAll('.input-box').forEach(box => {
    const micBtn = box.querySelector('.btn-icon');
    const inputEl = box.querySelector('input');
    if (micBtn && inputEl) {
      initVoiceRecognition(micBtn, inputEl);
    }
  });

  // 3. Inisialisasi Filter & Counter Input
  initFilterLogic(() => jalankanPencarianBackend());
  initInputCounters(() => jalankanPencarianBackend());

  // 4. Tombol Racik Resep
  const btnYukCek = document.getElementById('btnYukCek');
  if (btnYukCek) {
    btnYukCek.addEventListener('click', () => jalankanPencarianBackend());
  }

  // 5. Cari Menu Modal Interaksi
  const btnCariMenu = document.getElementById('btnCariMenu');
  const modalCariMenu = document.getElementById('modalCariMenu');
  const btnCloseCariMenu = document.getElementById('btnCloseCariMenu');
  const filterOverlay = document.getElementById('filterOverlay');

  if (btnCariMenu && modalCariMenu) {
    btnCariMenu.addEventListener('click', (e) => {
      e.preventDefault();
      if (filterOverlay) filterOverlay.classList.add('hidden');
      renderModalRecipesPage(currentRecipeData, 1, 4, onModalPageChange);
      modalCariMenu.classList.remove('hidden');
    });
  }

  if (btnCloseCariMenu && modalCariMenu) {
    btnCloseCariMenu.addEventListener('click', () => modalCariMenu.classList.add('hidden'));
  }

  if (modalCariMenu) {
    modalCariMenu.addEventListener('click', (e) => {
      if (e.target === modalCariMenu) modalCariMenu.classList.add('hidden');
    });
  }

  // 6. Bind Kartu Statis HTML Bawaan
  document.querySelectorAll('.recipe-card-compact').forEach(card => {
    card.addEventListener('click', () => {
      const title = card.querySelector('h2')?.textContent || 'Detail Resep';
      const items = Array.from(card.querySelectorAll('.ingredient-num-list li')).map(el => el.textContent);
      tampilkanDetailResep({
        nama_resep: title,
        bahan_terpakai: items,
        bahan_tidak_tersedia: []
      });
    });
  });

  // 7. Load Data Awal Resep
  loadInitialRecipesFromBackend();
});