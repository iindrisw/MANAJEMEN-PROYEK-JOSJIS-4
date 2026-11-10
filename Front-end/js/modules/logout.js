/**
 * Modul Logout - Racik Rasa
 * Menangani modal konfirmasi, pembersihan token JWT, dan redirect ke Halaman Utama.
 */

document.addEventListener('DOMContentLoaded', () => {
    setupLogoutFeature();
});

function setupLogoutFeature() {
    const logoutBtn = document.getElementById('logout-btn');
    const logoutModal = document.getElementById('logout-modal');
    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
    const cancelLogoutBtn = document.getElementById('cancel-logout-btn');

    if (!logoutBtn || !logoutModal) return;

    // Skenario 1: Munculkan modal saat tombol Keluar diklik
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logoutModal.classList.remove('hidden');
        logoutModal.classList.add('flex');
    });

    // Skenario 3: Tutup modal saat tombol Batal diklik
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    }

    // Tutup modal jika area luar kotak diklik
    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            closeModal();
        }
    });

    // Skenario 2: Konfirmasi keluar akun & hapus token JWT
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                // Hapus token autentikasi dan state dari penyimpanan lokal
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                sessionStorage.clear();

                // Redirect otomatis ke Halaman Utama
                window.location.href = '../index.html'; 
            } catch (error) {
                console.error('Gagal melakukan logout:', error);
                localStorage.removeItem('token');
                window.location.href = '../index.html';
            }
        });
    }

    function closeModal() {
        logoutModal.classList.remove('flex');
        logoutModal.classList.add('hidden');
    }
}