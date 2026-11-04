document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const inputIdentifier = document.getElementById('loginNama'); // Menyesuaikan dengan input nama/email di login.html
  const inputSandi = document.getElementById('loginSandi');
  const btnMasuk = document.getElementById('btnMasuk');
  const forgotLink = document.getElementById('forgotPasswordLink');

  // Toggle Visibility Password
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const inputEl = document.getElementById(targetId);
      const icon = button.querySelector('i');

      if (inputEl.type === 'password') {
        inputEl.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        inputEl.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });

  // Helper setError
  function setError(inputElement, message) {
    const formGroup = inputElement.closest('.form-group');
    const errorMsgEl = formGroup.querySelector('.error-message');
    formGroup.classList.add('error');
    if (errorMsgEl) {
      errorMsgEl.textContent = message;
    }
  }

  // Helper clearError
  function clearError(inputElement) {
    const formGroup = inputElement.closest('.form-group');
    const errorMsgEl = formGroup.querySelector('.error-message');
    formGroup.classList.remove('error');
    if (errorMsgEl) errorMsgEl.textContent = '';
  }

  [inputIdentifier, inputSandi].forEach(input => {
    input.addEventListener('input', () => clearError(input));
  });

  // Lupa kata sandi alert
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Fitur lupa kata sandi belum tersedia.');
  });

  // Event Submit Form Login ke Backend API
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;
    const identifier = inputIdentifier.value.trim();
    const password = inputSandi.value;

    if (!identifier) {
      setError(inputIdentifier, 'Nama atau email wajib diisi');
      isValid = false;
    }
    if (!password) {
      setError(inputSandi, 'Kata sandi wajib diisi');
      isValid = false;
    }

    if (!isValid) return;

    // Indikator Loading
    btnMasuk.disabled = true;
    btnMasuk.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> MEMPROSES...';

    try {
      // Sesuaikan endpoint API backend-mu (misal: /api/auth/login atau sesuaikan routernya)
      const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          identifier: identifier, // Sesuai dengan parameter backend auth_service.py
          password: password 
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // Menangani kode error dari backend (misal: AKUN_GOOGLE, KREDENSIAL_SALAH, dll)
        throw new Error(result.message || 'Nama/email atau kata sandi salah.');
      }

      // Simpan token dan data user ke localStorage
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
      }

      // Berhasil masuk, arahkan ke halaman utama/dashboard aplikasi
      window.location.href = 'index.html';

    } catch (error) {
      console.error('Login error:', error);
      setError(inputSandi, error.message || 'Gagal terhubung ke server backend.');
    } finally {
      btnMasuk.disabled = false;
      btnMasuk.textContent = 'MASUK';
    }
  });
});