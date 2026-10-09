import { showCustomModal } from './ui.js';
import { initVoiceRecognition } from './voice.js';

const MAX_BAHAN_PER_INPUT = 3;
const MAX_DYNAMIC_ROWS = 1;

export function handleInputCounter(inputElement, counterElement = null, onEnterPress) {
  if (!inputElement) return;

  inputElement.addEventListener('input', () => {
    let bahanArray = inputElement.value.split(',').map(item => item.trim()).filter(Boolean);
    let jumlahBahan = bahanArray.length;

    if (jumlahBahan > MAX_BAHAN_PER_INPUT) {
      showCustomModal("Maksimal 3 bahan per-baris! Silakan klik tombol (+) disebelah kiri untuk menambahkan baris input baru.", "Batas Maksimal Bahan");
      inputElement.value = bahanArray.slice(0, MAX_BAHAN_PER_INPUT).join(', ') + ', ';
      jumlahBahan = MAX_BAHAN_PER_INPUT;
    }

    if (counterElement) {
      counterElement.textContent = `${jumlahBahan}/${MAX_BAHAN_PER_INPUT}`;
    }
  });

  inputElement.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && onEnterPress) onEnterPress();
  });
}

export function initInputCounters(onEnterPress) {
  const inputSection = document.querySelector('.input-section');
  const inputUtama = document.getElementById('inputBahanUtama');
  const inputLainnya = document.getElementById('inputBahanLainnya');
  const counterEl = document.querySelector('.counter');
  const btnAdd = document.querySelector('.btn-add');

  if (inputUtama) handleInputCounter(inputUtama, null, onEnterPress);
  if (inputLainnya && counterEl) handleInputCounter(inputLainnya, counterEl, onEnterPress);

  if (btnAdd && inputSection) {
    btnAdd.addEventListener('click', () => {
      const currentDynamicRows = inputSection.querySelectorAll('.btn-remove').length;
      if (currentDynamicRows >= MAX_DYNAMIC_ROWS) {
        showCustomModal("Penambahan baris input sudah mencapai batas maksimal (1 baris)!", "Batas Maksimal Form");
        return;
      }

      const newRow = document.createElement('div');
      newRow.className = 'input-row';
      newRow.innerHTML = `
        <button type="button" class="btn-remove" title="Hapus Form" style="background:#f7f5ee; border:2px solid #4a4a4a; border-radius:4px; width:38px; height:38px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <i class="fa-solid fa-minus"></i>
        </button>
        <div class="input-box flex-grow">
          <button type="button" class="btn-icon" title="Input Suara"><i class="fa-solid fa-microphone"></i></button>
          <input type="text" placeholder="Masukan Bahan Lainnya" />
        </div>
        <div class="counter-new">0/3</div>
      `;

      inputSection.appendChild(newRow);
      const newBox = newRow.querySelector('.input-box');
      handleInputCounter(newRow.querySelector('input'), newRow.querySelector('.counter-new'), onEnterPress);
      if (newBox) {
        initVoiceRecognition(newBox.querySelector('.btn-icon'), newBox.querySelector('input'));
      }
      newRow.querySelector('.btn-remove').addEventListener('click', () => newRow.remove());
    });
  }
}

export function dapatkanBahanTerpisah() {
  const inputUtamaEl = document.getElementById('inputBahanUtama');
  const inputLainnyaEls = document.querySelectorAll('.input-section input[type="text"]:not(#inputBahanUtama)');

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