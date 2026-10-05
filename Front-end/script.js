document.addEventListener('DOMContentLoaded', () => {
  // ================= 1. ELEMEN SELEKTOR =================
  const viewBeranda = document.getElementById('viewBeranda');
  const viewSignup = document.getElementById('viewSignup');

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
  const btnFilter = document.getElementById('btnFilter');
  const pageButtons = document.querySelectorAll('.page-btn');

  // Elemen Popup Filter Overlay
  const filterOverlay = document.getElementById('filterOverlay');
  const activeTagsContainer = document.getElementById('activeTagsContainer');
  const placeholderText = document.getElementById('filterPlaceholderText');
  const chipButtons = document.querySelectorAll('.chip-btn');
  const btnCloseFilter = document.getElementById('btnCloseFilter');
  const btnExecuteSearch = document.getElementById('btnExecuteSearch');

  // Elemen Modal Custom
  const modal = document.getElementById('customModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  const MAX_BAHAN_PER_INPUT = 3;

  // Set untuk menyimpan tag filter terpilih
  let selectedFilterTags = new Set(['KACANG', 'SEAFOOD']);

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

    if (targetView === 'signup') {
      viewSignup.classList.remove('hidden');
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
      showCustomModal('Halaman Bookmark belum tersedia.', 'Informasi');
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

  // ================= 4. LOGIKA FILTER & INLINE TAGS =================
  function renderActiveFilterTags() {
    activeTagsContainer.innerHTML = '';

    if (selectedFilterTags.size > 0) {
      if (placeholderText) placeholderText.style.display = 'none';
    } else {
      if (placeholderText) placeholderText.style.display = 'inline';
    }

    selectedFilterTags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag-active';
      tagEl.dataset.tag = tag;
      tagEl.innerHTML = `${tag} <i class="fa-solid fa-xmark remove-tag"></i>`;
      
      tagEl.querySelector('.remove-tag').addEventListener('click', (e) => {
        e.stopPropagation();
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
      jalankanPencarianBackend();
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

  // ================= 5. LOGIKA FORM SIGN UP =================
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;

      showCustomModal(`Akun atas nama ${name} (${email}) berhasil terdaftar!`, 'Sign Up Berhasil');
      signupForm.reset();
    });
  }

  // ================= 6. FUNGSI HITUNG & VALIDASI BAHAN KOMA =================
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
          "Maksimal 3 bahan per baris! Klik tombol plus (+) untuk menambah baris input baru.", 
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

  // ================= 7. TOMBOL PLUS (+) TAMBAH INPUT BARU =================
  if (btnAdd && inputSection) {
    btnAdd.addEventListener('click', () => {
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

  // ================= 8. MENGUMPULKAN BAHAN DARI SEMUA INPUT =================
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

  // ================= 9. RENDER KE CARD UTAMA (KLIK UNTUK DETAIL PENUH) =================
  async function jalankanPencarianBackend() {
    const daftarBahan = dapatkanDaftarBahan();
    
    if (daftarBahan.length === 0) {
      showCustomModal("Masukkan minimal satu bahan terlebih dahulu!", "Peringatan");
      return;
    }

    const keywordQuery = daftarBahan.join(',');

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/search-bahan?q=${encodeURIComponent(keywordQuery)}`);
      const result = await response.json();

      if (result.total_ditemukan > 0) {
        const containerBeranda = document.querySelector('#viewBeranda') || document.body;
        
        let gridContainer = document.getElementById('dynamicCardContainer');
        if (!gridContainer) {
          gridContainer = document.createElement('div');
          gridContainer.id = 'dynamicCardContainer';
          gridContainer.style.cssText = "display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px;";
          
          const inputSec = document.querySelector('.input-section');
          if (inputSec && inputSec.parentNode) {
            inputSec.parentNode.insertBefore(gridContainer, inputSec.nextSibling);
          } else {
            containerBeranda.appendChild(gridContainer);
          }
        }

        gridContainer.innerHTML = '';

        result.data.forEach((resep) => {
          const card = document.createElement('div');
          card.style.cssText = "background: #fff; border: 2px solid #4a4a4a; border-radius: 8px; padding: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: transform 0.2s;";
          
          card.onmouseover = () => card.style.transform = "translateY(-3px)";
          card.onmouseout = () => card.style.transform = "translateY(0)";

          let previewBahanHtml = '';
          if (resep.bahan_terpakai && resep.bahan_terpakai.length > 0) {
            resep.bahan_terpakai.slice(0, 3).forEach(b => {
              previewBahanHtml += `<li style="font-size: 0.85em; margin-bottom: 3px;"><i class="fa-solid fa-check"></i> ${b.nama_bahan} <span style="color:#666;">(${b.takaran})</span></li>`;
            });
          } else {
            previewBahanHtml = '<li style="font-size: 0.85em;">Bahan tidak tersedia</li>';
          }

          card.innerHTML = `
            <div>
              <h3 style="font-size: 1.1em; font-weight: bold; margin-bottom: 8px; border-bottom: 2px solid #333; padding-bottom: 5px;">${resep.nama_resep}</h3>
              <div style="font-size: 0.85em; font-weight: bold; margin-bottom: 5px; color: #e11d48;"><i class="fa-solid fa-heart"></i> ${resep.jumlah_like} Suka</div>
              <p style="font-size: 0.9em; font-weight: bold; margin: 10px 0 5px 0;">Bahan Utama:</p>
              <ul style="margin: 0; padding-left: 15px; list-style-type: none;">
                ${previewBahanHtml}
              </ul>
              <p style="font-size: 0.75em; color: #2563eb; margin-top: 8px; font-style: italic;">*Klik card untuk melihat resep lengkap</p>
            </div>
            <div style="margin-top: 15px;">
              <span style="display: block; text-align: center; background: #333; color: #fff; padding: 6px 10px; border-radius: 4px; font-size: 0.85em; font-weight: bold;">Pilih Resep Ini</span>
            </div>
          `;

          card.addEventListener('click', () => {
            let detailBahanHtml = '';
            if (resep.bahan_terpakai && resep.bahan_terpakai.length > 0) {
              resep.bahan_terpakai.forEach(b => {
                detailBahanHtml += `<li style="margin-bottom: 5px; font-size: 0.95em;">✅ <strong>${b.nama_bahan}</strong> - <span style="color: #444;">${b.takaran}</span></li>`;
              });
            } else {
              detailBahanHtml = '<li>Tidak ada detail bahan</li>';
            }

            const detailContent = `
              <div style="text-align: left; max-height: 400px; overflow-y: auto; padding-right: 5px;">
                <h2 style="font-size: 1.3em; font-weight: bold; margin-bottom: 10px; color: #111;">${resep.nama_resep}</h2>
                <div style="font-size: 0.9em; color: #e11d48; font-weight: bold; margin-bottom: 15px;"><i class="fa-solid fa-heart"></i> ${resep.jumlah_like} Suka</div>
                
                <h4 style="font-size: 1.05em; font-weight: bold; margin-bottom: 8px; border-bottom: 2px solid #ccc; padding-bottom: 4px;">Daftar Bahan Lengkap:</h4>
                <ul style="margin: 0 0 20px 15px; padding: 0; list-style-type: none;">
                  ${detailBahanHtml}
                </ul>

                <div style="text-align: center; margin-top: 20px;">
                  <a href="https://cookpad.com${resep.url}" target="_blank" style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 0.9em;">Buka Panduan di Cookpad ↗</a>
                </div>
              </div>
            `;

            showCustomModal(detailContent, 'Detail Lengkap Resep', true);
          });

          gridContainer.appendChild(card);
        });

      } else {
        showCustomModal(`Tidak ditemukan resep untuk bahan "${keywordQuery}".`, 'Hasil Pencarian');
      }
    } catch (error) {
      console.error("Gagal terhubung ke backend:", error);
      showCustomModal("Gagal terhubung ke server Flask. Pastikan file main.py sudah berjalan.", "Koneksi Error");
    }
  }

  // ================= 10. INTERAKSI PAGINASI =================
  pageButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      pageButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ================= 11. FITUR VOICE INPUT (WEB SPEECH API) =================
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