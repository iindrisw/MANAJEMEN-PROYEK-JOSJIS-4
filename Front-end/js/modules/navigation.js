import { showCustomModal } from './ui.js';

export function switchView(targetView) {
  const viewBeranda = document.getElementById('viewBeranda');
  const viewSignup = document.getElementById('viewSignup');
  const viewDetailResep = document.getElementById('viewDetailResep');

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

export function initNavigation() {
  const navBeranda = document.getElementById('navBeranda');
  const navBookmark = document.getElementById('navBookmark');
  const navAccount = document.getElementById('navAccount');
  const navItems = document.querySelectorAll('.nav-item');
  const btnBackFromDetail = document.getElementById('btnBackFromDetail');
  const btnCopyMissing = document.getElementById('btnCopyMissing');
  const btnLihatLangkah = document.getElementById('btnLihatLangkah');
  const signupForm = document.getElementById('signupForm');

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
      showCustomModal('Halaman Bookmark saat ini sedang nonaktif.', 'Informasi');
    });
  }

  if (navAccount) {
    navAccount.addEventListener('click', (e) => {
      e.preventDefault();
      showCustomModal('Halaman Akun saat ini sedang nonaktif.', 'Informasi');
    });
  }

  if (btnBackFromDetail) {
    btnBackFromDetail.addEventListener('click', () => switchView('beranda'));
  }

  if (btnCopyMissing) {
    btnCopyMissing.addEventListener('click', () => {
      const missingLis = document.querySelectorAll('#viewDetailResep .detail-list.missing li span');
      const text = Array.from(missingLis).map(li => `- ${li.textContent}`).join('\n');
      navigator.clipboard.writeText(text || 'Tidak ada bahan tak tersedia').then(() => {
        showCustomModal('Daftar bahan yang tidak tersedia telah disalin!', 'Berhasil Disalin');
      });
    });
  }

  if (btnLihatLangkah) {
    btnLihatLangkah.addEventListener('click', () => {
      showCustomModal('Menampilkan langkah-langkah memasak resep...', 'Langkah Memasak');
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;
      showCustomModal(`Akun atas nama ${name} (${email}) berhasil terdaftar!`, 'Sign Up Berhasil');
      signupForm.reset();
    });
  }
}