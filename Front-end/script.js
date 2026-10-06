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
  const pageButtons = document.querySelectorAll('.page-btn');

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
  const recipeCards = document.querySelectorAll('.recipe-card-compact');
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

  // Konfigurasi Input & Filter
  const MAX_BAHAN_PER_INPUT = 3;
  const MAX_DYNAMIC_ROWS = 1;
  let selectedFilterTags = new Set();

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
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', hideCustomModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideCustomModal();
      }
    });
  }

  // ================= 3. LOGIKA SWITCHING TAMPILAN =================
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
      showCustomModal('Halaman Bookmark belum tersedia. Silahkan Login terlebih dahulu.', 'Informasi');
    });
  }

  if (navAccount) {
    navAccount.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      navAccount.classList.add('active');
      switchView('signup');
    });
  }

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
  }

  if (btnCopyMissing) {
    btnCopyMissing.addEventListener('click', () => {
      const missingText = "- Ayam\n- Telor\n- Sapi\n- Udang\n- Cabai";
      navigator.clipboard.writeText(missingText).then(() => {
        showCustomModal('Daftar bahan yang tidak tersedia telah disalin!', 'Berhasil Disalin');
      }).catch(() => {
        showCustomModal(missingText, 'Daftar Bahan Tidak Tersedia');
      });
    });
  }

  if (btnLihatLangkah) {
    btnLihatLangkah.addEventListener('click', () => {
      showCustomModal('Menampilkan langkah-langkah memasak resep...', 'Langkah Memasak');
    });
  }

  // ================= 5. LOGIKA FILTER & INLINE TAGS =================
  function renderActiveFilterTags() {
    if (!activeTagsContainer) return;
    activeTagsContainer.innerHTML = '';

    if (selectedFilterTags.size > 0) {
      if (placeholderText) placeholderText.style.display = 'none';
    } else {
      if (placeholderText) placeholderText.style.display = 'inline';
    }

    activeTagsContainer.style.display = 'flex';
    activeTagsContainer.style.flexWrap = 'wrap';
    activeTagsContainer.style.gap = '8px';
    activeTagsContainer.style.alignItems = 'center';

    selectedFilterTags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag-active';
      tagEl.dataset.tag = tag;
      tagEl.textContent = tag;
      
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
      const tagVal = chip.dataset.tag;
      if (selectedFilterTags.has(tagVal)) {
        chip.classList.add('selected');
      } else {
        chip.classList.remove('selected');
      }
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

  // ================= 6. INTERAKSI TOMBOL YUK CEK & CARI MENU =================
  if (btnYukCek) {
    btnYukCek.addEventListener('click', () => {
      const bahan = dapatkanDaftarBahan();
      if (bahan.length === 0) {
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
      modalCariMenu.classList.remove('hidden');
    });
  }

  if (btnCloseCariMenu && modalCariMenu) {
    btnCloseCariMenu.addEventListener('click', () => {
      modalCariMenu.classList.add('hidden');
    });
  }

  if (modalCariMenu) {
    modalCariMenu.addEventListener('click', (e) => {
      if (e.target === modalCariMenu) {
        modalCariMenu.classList.add('hidden');
      }
    });
  }

  // ================= 7. LOGIKA FORM SIGN UP =================
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;

      showCustomModal(`Akun atas nama ${name} (${email}) berhasil terdaftar!`, 'Sign Up Berhasil');
      signupForm.reset();
    });
  }

  // ================= 8. FUNGSI HITUNG & VALIDASI BAHAN KOMA =================
  function handleInputCounter(inputElement, counterElement = null) {
    if (!inputElement) return;

    inputElement.addEventListener('input', () => {
      let rawText = inputElement.value;
      let bahanArray = rawText
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      let jumlahBahan = bahanArray.length;

      if (jumlahBahan > MAX_BAHAN_PER_INPUT) {
        showCustomModal(
          "Maksimal 3 bahan per-baris! Silahkan Klik tombol (+) disebelah kiri untuk menambahkan form baru.", 
          "Batas Maksimal Bahan"
        );
        
        const bahanTerbatasi = bahanArray.slice(0, MAX_BAHAN_PER_INPUT).join(', ');
        inputElement.value = bahanTerbatasi + ', ';
        jumlahBahan = MAX_BAHAN_PER_INPUT;
      }

      if (counterElement) {
        counterElement.textContent = `${jumlahBahan}/${MAX_BAHAN_PER_INPUT}`;
      }
    });

    inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        jalankanPencarianBackend();
      }
    });
  }

  if (inputUtama) handleInputCounter(inputUtama);
  if (inputLainnya && counterEl) handleInputCounter(inputLainnya, counterEl);

  // ================= 9. TOMBOL PLUS (+) TAMBAH INPUT BARU =================
  if (btnAdd && inputSection) {
    btnAdd.addEventListener('click', () => {
      const currentDynamicRows = inputSection.querySelectorAll('.btn-remove').length;

      if (currentDynamicRows >= MAX_DYNAMIC_ROWS) {
        showCustomModal(
          "Penambahan baris input sudah mencapai batas maksimal (1 baris)!", 
          "Batas Maksimal Form"
        );
        return;
      }

      const newRow = document.createElement('div');
      newRow.className = 'input-row';

      newRow.innerHTML = `
        <button type="button" class="btn-remove" title="Hapus Form" style="background:#f7f5ee; border:2px solid #4a4a4a; border-radius:4px; width:38px; height:38px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <i class="fa-solid fa-minus"></i>
        </button>

        <div class="input-box flex-grow">
          <button type="button" class="btn-icon btn-mic" title="Input Suara">
            <i class="fa-solid fa-microphone"></i>
          </button>
          <input 
            type="text" 
            placeholder="Masukan Bahan Lainnya" 
          />
        </div>

        <div class="counter-new">0/3</div>
      `;

      inputSection.appendChild(newRow);

      const newInput = newRow.querySelector('input');
      const newCounter = newRow.querySelector('.counter-new');
      const btnRemove = newRow.querySelector('.btn-remove');
      const newMic = newRow.querySelector('.btn-mic');

      handleInputCounter(newInput, newCounter);
      initVoiceRecognition(newMic, newInput);

      btnRemove.addEventListener('click', () => {
        newRow.remove();
      });
    });
  }

  // ================= 10. MENGUMPULKAN BAHAN DARI SEMUA INPUT =================
  function dapatkanDaftarBahan() {
    const inputs = document.querySelectorAll('.input-section input[type="text"]');
    const daftarBahan = [];

    inputs.forEach(input => {
      const val = input.value.trim().toLowerCase();
      if (val) {
        const items = val.split(',').map(item => item.trim()).filter(item => item.length > 0);
        daftarBahan.push(...items);
      }
    });

    return [...new Set(daftarBahan)];
  }

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
      return;
    }

    const keywordQuery = daftarBahan.join(',');

    if (recipeListContainer) {
      recipeListContainer.innerHTML = `<p style="text-align:center; grid-column: span 2; font-weight:bold; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Mencari resep...</p>`;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/search-bahan?q=${encodeURIComponent(keywordQuery)}`);
      const result = await response.json();

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
      }
    } catch (error) {
      console.error("Gagal terhubung ke backend:", error);
      showCustomModal("Gagal terhubung ke server Flask. Pastikan file main.py sudah berjalan.", "Koneksi Error");
    }
  }

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
});