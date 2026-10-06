document.addEventListener('DOMContentLoaded', () => {
  // ================= 1. ELEMEN SELEKTOR =================
  const viewBeranda = document.getElementById('viewBeranda');
  const viewSignup = document.getElementById('viewSignup');
  const viewDetailResep = document.getElementById('viewDetailResep');

  const navBeranda = document.getElementById('navBeranda');
  const navBookmark = document.getElementById('navBookmark');
  const navAccount = document.getElementById('navAccount');
  const navItems = document.querySelectorAll('.nav-item');

  const signupForm = document.getElementById('signupForm');

  const inputSection = document.querySelector('.input-section');
  const inputUtama = document.getElementById('inputBahanUtama');
  const inputLainnya = document.getElementById('inputBahanLainnya');
  const counterEl = document.querySelector('.counter');
  const btnAdd = document.querySelector('.btn-add');
<<<<<<< HEAD

  // Tombol Bar Aksi
  const btnYukCek = document.getElementById('btnYukCek');
  const btnCariMenu = document.getElementById('btnCariMenu');
=======
  const pageButtons = document.querySelectorAll('.page-btn');
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6

  // Tombol Bar Aksi
  const btnYukCek = document.getElementById('btnYukCek');
  const btnCariMenu = document.getElementById('btnCariMenu');

  // Elemen Popup Filter Overlay
  const filterOverlay = document.getElementById('filterOverlay');
  const activeTagsContainer = document.getElementById('activeTagsContainer');
  const placeholderText = document.getElementById('filterPlaceholderText');
  const chipButtons = document.querySelectorAll('.chip-btn');
  const btnCloseFilter = document.getElementById('btnCloseFilter');
  const btnExecuteSearch = document.getElementById('btnExecuteSearch');
  const btnFilter = document.getElementById('btnFilter');

  // Elemen Detail Resep
<<<<<<< HEAD
=======
  const recipeCards = document.querySelectorAll('.recipe-card-compact');
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
  const btnBackFromDetail = document.getElementById('btnBackFromDetail');
  const btnCopyMissing = document.getElementById('btnCopyMissing');
  const btnLihatLangkah = document.getElementById('btnLihatLangkah');

  // Elemen Modal Pemberitahuan Custom
  const modal = document.getElementById('customModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  // Elemen Modal Cari Menu Pop-up
  const modalCariMenu = document.getElementById('modalCariMenu');
  const btnCloseCariMenu = document.getElementById('btnCloseCariMenu');

  // Container Resep di HTML
  const recipeListContainer = document.getElementById('recipeList');

<<<<<<< HEAD
  // Konfigurasi
  const MAX_BAHAN_PER_INPUT = 3;
  const MAX_DYNAMIC_ROWS = 1;
  let selectedFilterTags = new Set();

  // ================= REPLACE BAGIAN KONFIGURASI & DATA AWAL =================
  const ITEMS_PER_PAGE = 6;
  const MODAL_ITEMS_PER_PAGE = 4;
  let currentBackendPage = 1;
  let currentModalPage = 1;

  // Data resep default agar "CARI MENU" langsung berisi data resep saat baru dibuka
  const initialRecipes = [
    {
      nama_resep: "Sate Telur Gulung Crispy Ekonomis Isi Sosis",
      bahan_terpakai: ["BLOK KALDU AYAM", "AIR", "BUTIR TELUR", "MINYAK GORENG", "SOSIS", "LADA BUBUK", "GARAM", "BAWANG PUTIH HALUSKAN"],
      bahan_tidak_tersedia: []
    },
    {
      nama_resep: "Ayam Goreng Bawang Khas Batam",
      bahan_terpakai: ["AYAM", "BAWANG PUTIH", "GARAM", "LADA BUBUK"],
      bahan_tidak_tersedia: []
    },
    {
      nama_resep: "Ayam Goreng Kecap",
      bahan_terpakai: ["GULA", "BAWANG PUTIH ULEK HALUS CINCANG HALUS", "CABE MERAH IRIS SERONG", "CM JAHE MEMARKAN", "BAWANG BOMBAY IRIS"],
      bahan_tidak_tersedia: []
    },
    {
      nama_resep: "Menu dinner trio tumis - pokcoy, ayam bawang putih, bawang merah",
      bahan_terpakai: ["BATANG POKCOY", "BAWANG MERAH", "TUMIS POKCOY", "GULA"],
      bahan_tidak_tersedia: []
    },
    {
      nama_resep: "Nasi Goreng Mas Hilal loh ya",
      bahan_terpakai: ["KENTANG", "WORTEL", "SLEDRI", "CICAK"],
      bahan_tidak_tersedia: []
    }
  ];

  // Inisialisasi currentRecipeData langsung dari data awal
  let currentRecipeData = [...initialRecipes];
=======
  // Konfigurasi Input & Filter
  const MAX_BAHAN_PER_INPUT = 3;
  const MAX_DYNAMIC_ROWS = 1;
  let selectedFilterTags = new Set();
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6

  // ================= 2. FUNGSI CUSTOM MODAL =================
  function showCustomModal(content, title = "Pemberitahuan", isHtml = false) {
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

  function hideCustomModal() {
    if (modal) modal.classList.add('hidden');
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', hideCustomModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideCustomModal();
    });
  }

  // ================= 3. SWITCHING TAMPILAN & DETAIL RESEP =================
  function switchView(targetView) {
    if (!viewBeranda || !viewSignup) return;

    viewBeranda.classList.add('hidden');
    viewSignup.classList.add('hidden');
    if (viewDetailResep) viewDetailResep.classList.add('hidden');

    if (targetView === 'signup') {
      viewSignup.classList.remove('hidden');
    } else if (targetView === 'detailResep' && viewDetailResep) {
      viewDetailResep.classList.remove('hidden');
    } else {
      viewBeranda.classList.remove('hidden');
    }
  }

  function tampilkanDetailResep(resep) {
    if (!viewDetailResep) return;

    const detailTitle = viewDetailResep.querySelector('.detail-title');
    const detailListTerpakai = viewDetailResep.querySelector('.detail-section:nth-of-type(1) .detail-list');
    const detailListMissing = viewDetailResep.querySelector('.detail-list.missing');

    if (detailTitle) {
      detailTitle.textContent = resep.nama_resep || 'Detail Resep';
    }

    if (detailListTerpakai) {
      detailListTerpakai.innerHTML = '';
      const bahanTerpakai = resep.bahan_terpakai || [];
      if (bahanTerpakai.length > 0) {
        bahanTerpakai.forEach(b => {
          const namaBahan = typeof b === 'object' ? b.nama_bahan : b;
          detailListTerpakai.innerHTML += `
            <li><i class="fa-solid fa-square-check"></i> <span>${String(namaBahan).toUpperCase()}</span></li>
          `;
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
          detailListMissing.innerHTML += `
            <li><i class="fa-regular fa-square"></i> <span>${String(namaBahan).toUpperCase()}</span></li>
          `;
        });
      } else {
        detailListMissing.innerHTML = '<li><span>Semua bahan tersedia</span></li>';
      }
    }

    switchView('detailResep');
  }

  // Navigasi Bawah
  if (navBeranda) {
    navBeranda.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      navBeranda.classList.add('active');
      switchView('beranda');
    });
  }

  if (navBookmark) {
    navBookmark.addEventListener('click', (e) => {
      e.preventDefault();
<<<<<<< HEAD
      showCustomModal('Halaman Bookmark saat ini sedang nonaktif.', 'Informasi');
=======
      showCustomModal('Halaman Bookmark belum tersedia. Silahkan Login terlebih dahulu.', 'Informasi');
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
    });
  }

  if (navAccount) {
    navAccount.addEventListener('click', (e) => {
      e.preventDefault();
      showCustomModal('Halaman Akun saat ini sedang nonaktif.', 'Informasi');
    });
  }

<<<<<<< HEAD
  if (btnBackFromDetail) {
    btnBackFromDetail.addEventListener('click', () => switchView('beranda'));
=======
  // ================= 4. LOGIKA DETAIL RESEP =================
  recipeCards.forEach(card => {
    card.addEventListener('click', () => {
      switchView('detailResep');
    });
  });

  if (btnBackFromDetail) {
    btnBackFromDetail.addEventListener('click', () => {
      switchView('beranda');
    });
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
  }

  if (btnCopyMissing) {
    btnCopyMissing.addEventListener('click', () => {
<<<<<<< HEAD
      const missingLis = document.querySelectorAll('#viewDetailResep .detail-list.missing li span');
      const text = Array.from(missingLis).map(li => `- ${li.textContent}`).join('\n');
      navigator.clipboard.writeText(text || 'Tidak ada bahan tak tersedia').then(() => {
        showCustomModal('Daftar bahan yang tidak tersedia telah disalin!', 'Berhasil Disalin');
=======
      const missingText = "- Ayam\n- Telor\n- Sapi\n- Udang\n- Cabai";
      navigator.clipboard.writeText(missingText).then(() => {
        showCustomModal('Daftar bahan yang tidak tersedia telah disalin!', 'Berhasil Disalin');
      }).catch(() => {
        showCustomModal(missingText, 'Daftar Bahan Tidak Tersedia');
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
      });
    });
  }

  if (btnLihatLangkah) {
    btnLihatLangkah.addEventListener('click', () => {
      showCustomModal('Menampilkan langkah-langkah memasak resep...', 'Langkah Memasak');
    });
  }

<<<<<<< HEAD
  // Bind awal untuk kartu statis HTML bawaan
  document.querySelectorAll('.recipe-card-compact').forEach(card => {
    card.addEventListener('click', () => {
      const title = card.querySelector('h2')?.textContent || 'Detail Resep';
      const items = Array.from(card.querySelectorAll('.card-body ul li span')).map(el => el.textContent);
      tampilkanDetailResep({
        nama_resep: title,
        bahan_terpakai: items,
        bahan_tidak_tersedia: []
      });
    });
  });

  // ================= 4. LOGIKA FILTER =================
=======
  // ================= 5. LOGIKA FILTER & INLINE TAGS =================
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
  function renderActiveFilterTags() {
    if (!activeTagsContainer) return;
    activeTagsContainer.innerHTML = '';

    if (placeholderText) {
      placeholderText.style.display = selectedFilterTags.size > 0 ? 'none' : 'inline';
    }

    activeTagsContainer.style.display = 'flex';
    activeTagsContainer.style.flexWrap = 'wrap';
    activeTagsContainer.style.gap = '8px';
    activeTagsContainer.style.alignItems = 'center';

    selectedFilterTags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag-active';
<<<<<<< HEAD
      tagEl.textContent = tag;
=======
      tagEl.dataset.tag = tag;
      tagEl.textContent = tag;
      
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
      tagEl.addEventListener('click', () => {
        selectedFilterTags.delete(tag);
        updateChipState();
        renderActiveFilterTags();
      });
      activeTagsContainer.appendChild(tagEl);
    });

    updateChipState();
  }

  function updateChipState() {
    chipButtons.forEach(chip => {
      chip.classList.toggle('selected', selectedFilterTags.has(chip.dataset.tag));
    });
  }

  if (btnFilter) {
    btnFilter.addEventListener('click', () => {
      if (modalCariMenu) modalCariMenu.classList.add('hidden');
      filterOverlay.classList.toggle('hidden');
    });
  }

  if (btnCloseFilter) {
    btnCloseFilter.addEventListener('click', () => {
      filterOverlay.classList.add('hidden');
      jalankanPencarianBackend();
    });
  }

  if (btnExecuteSearch) {
    btnExecuteSearch.addEventListener('click', () => {
      filterOverlay.classList.add('hidden');
      jalankanPencarianBackend();
    });
  }

  chipButtons.forEach(chip => {
    chip.addEventListener('click', () => {
      const tagValue = chip.dataset.tag;
      if (selectedFilterTags.has(tagValue)) {
        selectedFilterTags.delete(tagValue);
      } else {
        selectedFilterTags.add(tagValue);
      }
      renderActiveFilterTags();
    });
  });

  renderActiveFilterTags();

<<<<<<< HEAD
  // ================= 5. INTERAKSI TOMBOL YUK CEK & CARI MENU =================
  if (btnYukCek) {
    btnYukCek.addEventListener('click', () => {
      const { utama, lainnya } = dapatkanBahanTerpisah();
      if (!utama && !lainnya) {
=======
  // ================= 6. INTERAKSI TOMBOL YUK CEK & CARI MENU =================
  if (btnYukCek) {
    btnYukCek.addEventListener('click', () => {
      const bahan = dapatkanDaftarBahan();
      if (bahan.length === 0) {
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
        showCustomModal('Silakan masukkan bahan terlebih dahulu!', 'Peringatan');
      } else {
        jalankanPencarianBackend();
      }
    });
  }

  if (btnCariMenu && modalCariMenu) {
    btnCariMenu.addEventListener('click', (e) => {
      e.preventDefault();
      if (filterOverlay) filterOverlay.classList.add('hidden');
<<<<<<< HEAD
      renderModalRecipesPage(1);
=======
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
      modalCariMenu.classList.remove('hidden');
    });
  }

  if (btnCloseCariMenu && modalCariMenu) {
<<<<<<< HEAD
    btnCloseCariMenu.addEventListener('click', () => modalCariMenu.classList.add('hidden'));
=======
    btnCloseCariMenu.addEventListener('click', () => {
      modalCariMenu.classList.add('hidden');
    });
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
  }

  if (modalCariMenu) {
    modalCariMenu.addEventListener('click', (e) => {
<<<<<<< HEAD
      if (e.target === modalCariMenu) modalCariMenu.classList.add('hidden');
    });
  }

  // ================= 6. FORM SIGN UP =================
=======
      if (e.target === modalCariMenu) {
        modalCariMenu.classList.add('hidden');
      }
    });
  }

  // ================= 7. LOGIKA FORM SIGN UP =================
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;
      showCustomModal(`Akun atas nama ${name} (${email}) berhasil terdaftar!`, 'Sign Up Berhasil');
      signupForm.reset();
    });
  }

<<<<<<< HEAD
  // ================= 7. INPUT COUNTER & VALIDASI =================
=======
  // ================= 8. FUNGSI HITUNG & VALIDASI BAHAN KOMA =================
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
  function handleInputCounter(inputElement, counterElement = null) {
    if (!inputElement) return;

    inputElement.addEventListener('input', () => {
      let bahanArray = inputElement.value.split(',').map(item => item.trim()).filter(Boolean);
      let jumlahBahan = bahanArray.length;

      if (jumlahBahan > MAX_BAHAN_PER_INPUT) {
<<<<<<< HEAD
        showCustomModal("Maksimal 3 bahan! Silahkan klik tombol (+) disebelah kiri untuk menambahkan baris input baru.", "Batas Maksimal Bahan");
        inputElement.value = bahanArray.slice(0, MAX_BAHAN_PER_INPUT).join(', ') + ', ';
=======
        showCustomModal(
          "Maksimal 3 bahan per-baris! Silahkan Klik tombol (+) disebelah kiri untuk menambahkan form baru.", 
          "Batas Maksimal Bahan"
        );
        
        const bahanTerbatasi = bahanArray.slice(0, MAX_BAHAN_PER_INPUT).join(', ');
        inputElement.value = bahanTerbatasi + ', ';
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
        jumlahBahan = MAX_BAHAN_PER_INPUT;
      }

      if (counterElement) {
        counterElement.textContent = `${jumlahBahan}/${MAX_BAHAN_PER_INPUT}`;
      }
    });

    inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') jalankanPencarianBackend();
    });
  }

  if (inputUtama) handleInputCounter(inputUtama);
  if (inputLainnya && counterEl) handleInputCounter(inputLainnya, counterEl);

<<<<<<< HEAD
  if (btnAdd && inputSection) {
    btnAdd.addEventListener('click', () => {
      const currentDynamicRows = inputSection.querySelectorAll('.btn-remove').length;
      if (currentDynamicRows >= MAX_DYNAMIC_ROWS) {
        showCustomModal("Penambahan baris input sudah mencapai batas maksimal (1 baris)!", "Batas Maksimal Form");
=======
  // ================= 9. TOMBOL PLUS (+) TAMBAH INPUT BARU =================
  if (btnAdd && inputSection) {
    btnAdd.addEventListener('click', () => {
      const currentDynamicRows = inputSection.querySelectorAll('.btn-remove').length;

      if (currentDynamicRows >= MAX_DYNAMIC_ROWS) {
        showCustomModal(
          "Penambahan baris input sudah mencapai batas maksimal (1 baris)!", 
          "Batas Maksimal Form"
        );
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
        return;
      }

      const newRow = document.createElement('div');
      newRow.className = 'input-row';
      newRow.innerHTML = `
        <button type="button" class="btn-remove" title="Hapus Form" style="background:#f7f5ee; border:2px solid #4a4a4a; border-radius:4px; width:38px; height:38px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <i class="fa-solid fa-minus"></i>
        </button>
        <div class="input-box flex-grow">
          <button type="button" class="btn-icon btn-mic" title="Input Suara"><i class="fa-solid fa-microphone"></i></button>
          <input type="text" placeholder="Masukan Bahan Lainnya" />
        </div>
        <div class="counter-new">0/3</div>
      `;

      inputSection.appendChild(newRow);
      handleInputCounter(newRow.querySelector('input'), newRow.querySelector('.counter-new'));
      newRow.querySelector('.btn-remove').addEventListener('click', () => newRow.remove());
    });
  }

<<<<<<< HEAD
  function dapatkanBahanTerpisah() {
    const inputUtamaEl = document.getElementById('inputBahanUtama');
    const inputLainnyaEls = document.querySelectorAll('.input-section input[type="text"]:not(#inputBahanUtama)');
=======
  // ================= 10. MENGUMPULKAN BAHAN DARI SEMUA INPUT =================
  function dapatkanDaftarBahan() {
    const inputs = document.querySelectorAll('.input-section input[type="text"]');
    const daftarBahan = [];
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6

    let bahanUtama = inputUtamaEl && inputUtamaEl.value.trim()
      ? inputUtamaEl.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      : [];

    let bahanLainnya = [];
    inputLainnyaEls.forEach(input => {
      if (input.value.trim()) {
        bahanLainnya.push(...input.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
      }
    });

    return {
      utama: bahanUtama.join(','),
      lainnya: [...new Set(bahanLainnya)].join(',')
    };
  }

<<<<<<< HEAD
  // ================= 8. RENDER RESEP & PAGINASI BERANDA =================
  function renderPaginationUI() {
    const paginationBox = document.querySelector('.pagination-box');
    if (!paginationBox) return;

    paginationBox.innerHTML = '';
    const totalPages = Math.ceil(currentRecipeData.length / ITEMS_PER_PAGE);

    if (totalPages <= 1) {
      paginationBox.style.display = 'none';
=======
  // ================= 11. LOAD MOST LIKED OTOMATIS SAAT LANDING PAGE DIBUKA =================
  async function loadMostLikedRecipes() {
    if (!recipeListContainer) return;

    recipeListContainer.innerHTML = `<p style="text-align:center; grid-column: span 2; font-weight:bold; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Menyiapkan data resep untuk rekomendasi.</p>`;

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/most-liked`);
      const result = await response.json();

      if (result.status === "success" && result.data.length > 0) {
        recipeListContainer.innerHTML = '';

        result.data.forEach((resep) => {
          const card = document.createElement('article');
          card.className = 'recipe-card-compact';
          card.style.cursor = 'pointer';

          let previewBahanHtml = '';
          if (resep.bahan_terpakai && resep.bahan_terpakai.length > 0) {
            resep.bahan_terpakai.forEach(b => {
              previewBahanHtml += `<li><i class="fa-solid fa-square-check"></i> <span>${b.nama_bahan} (${b.takaran})</span></li>`;
            });
          } else {
            previewBahanHtml = '<li><span>Bahan tidak tersedia</span></li>';
          }

          card.innerHTML = `
            <header class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
              <h2>${resep.nama_resep}</h2>
              <span style="font-size: 0.8em; color: #e11d48; font-weight: bold;"><i class="fa-solid fa-heart"></i> ${resep.jumlah_like} Suka</span>
            </header>
            <div class="card-body">
              <h3>Bahan Terpakai</h3>
              <ul>
                ${previewBahanHtml}
              </ul>
            </div>
          `;

          card.addEventListener('click', () => {
            let detailBahanHtml = '';
            if (resep.bahan_terpakai && resep.bahan_terpakai.length > 0) {
              resep.bahan_terpakai.forEach(b => {
                detailBahanHtml += `<li><i class="fa-solid fa-square-check"></i> <span>${b.nama_bahan} - ${b.takaran}</span></li>`;
              });
            }

            const detailContent = `
              <div style="text-align: left; max-height: 400px; overflow-y: auto;">
                <h3 style="margin-bottom: 8px;">${resep.nama_resep}</h3>
                <p style="color: #e11d48; font-weight: bold; margin-bottom: 12px;"><i class="fa-solid fa-heart"></i> ${resep.jumlah_like} Suka</p>
                <h4>Daftar Bahan Lengkap:</h4>
                <ul style="margin-bottom: 15px; padding-left: 15px; list-style-type: none;">
                  ${detailBahanHtml}
                </ul>
                <div style="text-align: center;">
                  <a href="https://cookpad.com${resep.url}" target="_blank" style="background: #2563eb; color: #fff; padding: 8px 15px; border-radius: 5px; text-decoration: none; font-weight: bold;">Buka Panduan di Cookpad ↗</a>
                </div>
              </div>
            `;
            showCustomModal(detailContent, 'Detail Resep', true);
          });

          recipeListContainer.appendChild(card);
        });
      }
    } catch (error) {
      console.error("Gagal memuat resep most liked:", error);
    }
  }

  // Panggil otomatis fungsi most liked saat halaman dibuka
  loadMostLikedRecipes();

  // ================= 12. INTEGRASI PENCARIAN BERDASARKAN BAHAN =================
  async function jalankanPencarianBackend() {
    const daftarBahan = dapatkanDaftarBahan();
    
    if (daftarBahan.length === 0) {
      showCustomModal("Masukkan minimal satu bahan terlebih dahulu!", "Peringatan");
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
      return;
    }

    paginationBox.style.display = 'flex';

    // Batasi maksimal 4 tombol angka yang tampil
    const maxVisibleButtons = Math.min(totalPages, 4);

    for (let i = 1; i <= maxVisibleButtons; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.type = 'button';
      pageBtn.className = `page-btn ${i === currentBackendPage ? 'active' : ''}`;
      pageBtn.textContent = i;

      pageBtn.addEventListener('click', () => {
        renderBackendRecipesPage(i);
        if (recipeListContainer) {
          window.scrollTo({ top: recipeListContainer.offsetTop - 80, behavior: 'smooth' });
        }
      });

      paginationBox.appendChild(pageBtn);
    }

    // Jika total halaman lebih dari 4, tambahkan titik-titik (...)
    if (totalPages > 4) {
      const dotsSpan = document.createElement('span');
      dotsSpan.className = 'page-dots';
      dotsSpan.textContent = '...';
      dotsSpan.style.cssText = 'color: #D05755; font-weight: 800; font-size: 14px; padding: 0 4px; display: flex; align-items: center;';
      paginationBox.appendChild(dotsSpan);
    }
  }

  function renderBackendRecipesPage(page = 1) {
    if (!recipeListContainer) return;
    currentBackendPage = page;
    recipeListContainer.innerHTML = '';

    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const pageRecipes = currentRecipeData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    pageRecipes.forEach((resep) => {
      const card = document.createElement('article');
      card.className = 'recipe-card-compact';

      let bahanListHtml = '';
      if (resep.bahan_terpakai && resep.bahan_terpakai.length > 0) {
        resep.bahan_terpakai.forEach(b => {
          const namaBahan = typeof b === 'object' ? b.nama_bahan : b;
          bahanListHtml += `
            <li>
              <i class="fa-solid fa-square-check"></i> 
              <span>${String(namaBahan).toUpperCase()}</span>
            </li>
          `;
        });
      } else {
        bahanListHtml = `<li><i class="fa-solid fa-square-check"></i> <span>-</span></li>`;
      }

      card.innerHTML = `
        <header class="card-header">
          <h2>${resep.nama_resep}</h2>
        </header>
        <div class="card-body">
          <h3>Bahan Terpakai</h3>
          <ul>
            ${bahanListHtml}
          </ul>
        </div>
      `;

      card.addEventListener('click', () => {
        tampilkanDetailResep(resep);
      });

      recipeListContainer.appendChild(card);
    });

    renderPaginationUI();
  }

  // ================= 9. RENDER RESEP & PAGINASI MODAL =================
  function renderModalRecipesPage(page = 1) {
    const scrollContainer = document.querySelector('.resep-scroll-container');
    if (!scrollContainer) return;

    currentModalPage = page;
    scrollContainer.innerHTML = '';

    if (!currentRecipeData || currentRecipeData.length === 0) {
      scrollContainer.innerHTML = `<p style="text-align:center; padding:20px; font-weight:800; font-size:12px; color:#D05755;">Belum ada resep yang ditemukan.</p>`;
      renderModalPaginationUI(0);
      return;
    }

    const startIndex = (page - 1) * MODAL_ITEMS_PER_PAGE;
    const pageRecipes = currentRecipeData.slice(startIndex, startIndex + MODAL_ITEMS_PER_PAGE);

    pageRecipes.forEach((resep) => {
      let bahanChecklistHtml = '';
      if (resep.bahan_terpakai && resep.bahan_terpakai.length > 0) {
        resep.bahan_terpakai.forEach(b => {
          const namaBahan = typeof b === 'object' ? b.nama_bahan : b;
          bahanChecklistHtml += `
            <div class="bahan-check"><i class="fa-regular fa-square-check"></i> ${String(namaBahan).toUpperCase()}</div>
          `;
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

      // Klik resep pada modal juga membuka Halaman Detail Resep
      article.addEventListener('click', () => {
        if (modalCariMenu) modalCariMenu.classList.add('hidden');
        tampilkanDetailResep(resep);
      });

      scrollContainer.appendChild(article);
    });

    renderModalPaginationUI(Math.ceil(currentRecipeData.length / MODAL_ITEMS_PER_PAGE));
  }

  function renderModalPaginationUI(totalPages) {
    const paginationModal = document.querySelector('.pagination-modal');
    if (!paginationModal) return;

    paginationModal.innerHTML = '';
    if (totalPages <= 1) {
      paginationModal.style.display = 'none';
      return;
    }

    paginationModal.style.display = 'flex';
    for (let i = 1; i <= totalPages; i++) {
      const pageSpan = document.createElement('span');
      pageSpan.className = `page-num ${i === currentModalPage ? 'active' : ''}`;
      pageSpan.textContent = i;
      pageSpan.addEventListener('click', () => renderModalRecipesPage(i));
      paginationModal.appendChild(pageSpan);
    }
  }

  // ================= 10. INTEGRASI PENCARIAN BACKEND =================
  async function jalankanPencarianBackend() {
    const { utama, lainnya } = dapatkanBahanTerpisah();

    if (!utama && !lainnya) {
      showCustomModal("Masukkan minimal satu bahan utama atau bahan lainnya!", "Peringatan");
      return;
    }

    if (recipeListContainer) {
      recipeListContainer.innerHTML = `<p style="text-align:center; grid-column: span 2; font-weight:bold; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat Resep...</p>`;
    }

    if (recipeListContainer) {
      recipeListContainer.innerHTML = `<p style="text-align:center; grid-column: span 2; font-weight:bold; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Mencari resep...</p>`;
    }

    try {
      const url = `http://127.0.0.1:5000/api/search-bahan?utama=${encodeURIComponent(utama)}&lainnya=${encodeURIComponent(lainnya)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Status HTTP ${response.status}`);
      }

      const result = await response.json();

<<<<<<< HEAD
      if (result.data && result.data.length > 0) {
        currentRecipeData = result.data;
        renderBackendRecipesPage(1);
      } else {
        currentRecipeData = [];
        if (recipeListContainer) {
          const kataBahan = [utama, lainnya].filter(Boolean).join(', ');
          recipeListContainer.innerHTML = `<p style="text-align:center; grid-column: span 2; padding: 20px;">Tidak ditemukan resep untuk bahan "${kataBahan}".</p>`;
        }
        renderPaginationUI();
=======
      if (result.total_ditemukan > 0) {
        if (!recipeListContainer) return;
        recipeListContainer.innerHTML = '';

        result.data.forEach((resep) => {
          const card = document.createElement('article');
          card.className = 'recipe-card-compact';
          card.style.cursor = 'pointer';

          let previewBahanHtml = '';
          if (resep.bahan_terpakai && resep.bahan_terpakai.length > 0) {
            resep.bahan_terpakai.forEach(b => {
              previewBahanHtml += `<li><i class="fa-solid fa-square-check"></i> <span>${b.nama_bahan} (${b.takaran})</span></li>`;
            });
          } else {
            previewBahanHtml = '<li><span>Bahan tidak tersedia</span></li>';
          }

          card.innerHTML = `
            <header class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
              <h2>${resep.nama_resep}</h2>
              <span style="font-size: 0.8em; color: #e11d48; font-weight: bold;"><i class="fa-solid fa-heart"></i> ${resep.jumlah_like} Suka</span>
            </header>
            <div class="card-body">
              <h3>Bahan Terpakai</h3>
              <ul>
                ${previewBahanHtml}
              </ul>
            </div>
          `;

          card.addEventListener('click', () => {
            let detailBahanHtml = '';
            if (resep.bahan_terpakai && resep.bahan_terpakai.length > 0) {
              resep.bahan_terpakai.forEach(b => {
                detailBahanHtml += `<li><i class="fa-solid fa-square-check"></i> <span>${b.nama_bahan} - ${b.takaran}</span></li>`;
              });
            }

            const detailContent = `
              <div style="text-align: left; max-height: 400px; overflow-y: auto;">
                <h3 style="margin-bottom: 8px;">${resep.nama_resep}</h3>
                <p style="color: #e11d48; font-weight: bold; margin-bottom: 12px;"><i class="fa-solid fa-heart"></i> ${resep.jumlah_like} Suka</p>
                <h4>Daftar Bahan Lengkap:</h4>
                <ul style="margin-bottom: 15px; padding-left: 15px; list-style-type: none;">
                  ${detailBahanHtml}
                </ul>
                <div style="text-align: center;">
                  <a href="https://cookpad.com${resep.url}" target="_blank" style="background: #2563eb; color: #fff; padding: 8px 15px; border-radius: 5px; text-decoration: none; font-weight: bold;">Buka Panduan di Cookpad ↗</a>
                </div>
              </div>
            `;
            showCustomModal(detailContent, 'Detail Resep', true);
          });

          recipeListContainer.appendChild(card);
        });

      } else {
        if (recipeListContainer) {
          recipeListContainer.innerHTML = `<p style="text-align:center; grid-column: span 2; padding: 20px;">Tidak ditemukan resep untuk bahan "${keywordQuery}".</p>`;
        }
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
      }
    } catch (error) {
      console.error("Gagal terhubung ke backend:", error);
      showCustomModal(`Gagal memuat resep (${error.message}). Pastikan server Flask di main.py sudah berjalan.`, "Koneksi Error");
      if (recipeListContainer) recipeListContainer.innerHTML = '';
    }
  }
});

// Otomatis muat resep dari backend saat pertama kali aplikasi dibuka
  async function loadInitialRecipesFromBackend() {
    try {
      const response =  await fetch('http://127.0.0.1:5000/api/search-bahan?utama=&lainnya=');
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          currentRecipeData = result.data;
          renderBackendRecipesPage(1);
        }
      }
    } catch (e) {
      // Jika server backend offline, aplikasi tetap menggunakan data initialRecipes di atas
    }
  }

<<<<<<< HEAD
  loadInitialRecipesFromBackend();

document.getElementById('btnHome')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.reload();
=======
  // ================= 13. INTERAKSI PAGINASI =================
  pageButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      pageButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ================= 14. FITUR VOICE INPUT (WEB SPEECH API) =================
  function initVoiceRecognition(btnMic, targetInput) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      btnMic.addEventListener('click', () => {
        showCustomModal('Fitur Voice Input tidak didukung oleh browser ini.', 'Perangkat Tidak Mendukung');
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';

    btnMic.addEventListener('click', () => {
      btnMic.style.color = '#ef4444';
      recognition.start();
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      targetInput.value = targetInput.value ? `${targetInput.value}, ${transcript}` : transcript;
      targetInput.dispatchEvent(new Event('input'));
      btnMic.style.color = '';
    };

    recognition.onerror = recognition.onend = () => {
      btnMic.style.color = '';
    };
  }

  document.querySelectorAll('.input-box').forEach(box => {
    const micBtn = box.querySelector('.btn-icon');
    const inputEl = box.querySelector('input');
    if (micBtn && inputEl) {
      initVoiceRecognition(micBtn, inputEl);
    }
  });
>>>>>>> 3524a36579f27bc86b42293677a4b773024906b6
});