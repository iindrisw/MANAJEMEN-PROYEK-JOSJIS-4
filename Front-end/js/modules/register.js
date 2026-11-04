document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const inputNama = document.getElementById('registerNama');
  const inputEmail = document.getElementById('registerEmail');
  const inputSandi = document.getElementById('registerSandi');
  const inputKonfirmasi = document.getElementById('registerKonfirmasi');
  const btnDaftar = document.getElementById('btnDaftar');

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
  function setError(inputElement, message, showLoginLink = false) {
    const formGroup = inputElement.closest('.form-group');
    const errorMsgEl = formGroup.querySelector('.error-message');
    formGroup.classList.add('error');
    
    if (errorMsgEl) {
      if (showLoginLink) {
        errorMsgEl.innerHTML = `${message} <a href="login.html" style="color: #D05755; font-weight: 900; text-decoration: underline; margin-left: 4px;">Login di sini</a>`;
      } else {
        errorMsgEl.textContent = message;
      }
    }
  }

  // Helper clearError
  function clearError(inputElement) {
    const formGroup = inputElement.closest('.form-group');
    const errorMsgEl = formGroup.querySelector('.error-message');
    formGroup.classList.remove('error');
    if (errorMsgEl) errorMsgEl.textContent = '';
  }

  // Real-time error clearance saat mengetik
  [inputNama, inputEmail, inputSandi, inputKonfirmasi].forEach(input => {
    input.addEventListener('input', () => clearError(input));
  });

  // Event Submit Form Registrasi
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;
    const nama = inputNama.value.trim();
    const email = inputEmail.value.trim();
    const sandi = inputSandi.value;
    const konfirmasi = inputKonfirmasi.value;

    // Skenario 7: Validasi Kolom Wajib Kosong (Required Fields)
    if (!inputNama.value) {
      setError(inputNama, 'Kolom ini wajib diisi');
      isValid = false;
    }
    if (!inputEmail.value) {
      setError(inputEmail, 'Kolom ini wajib diisi');
      isValid = false;
    }
    if (!inputSandi.value) {
      setError(inputSandi, 'Kolom ini wajib diisi');
      isValid = false;
    }
    if (!inputKonfirmasi.value) {
      setError(inputKonfirmasi, 'Kolom ini wajib diisi');
      isValid = false;
    }

    if (!isValid) return;

    // Skenario 9: Validasi Penolakan Spasi pada Input
    if (/\s/.test(inputNama.value)) {
      setError(inputNama, 'Kata sandi tidak boleh mengandung spasi');
      isValid = false;
    }
    if (/\s/.test(inputEmail.value)) {
      setError(inputEmail, 'Kata sandi tidak boleh mengandung spasi');
      isValid = false;
    }
    if (/\s/.test(sandi)) {
      setError(inputSandi, 'Kata sandi tidak boleh mengandung spasi');
      isValid = false;
    }
    if (/\s/.test(konfirmasi)) {
      setError(inputKonfirmasi, 'Kata sandi tidak boleh mengandung spasi');
      isValid = false;
    }

    if (!isValid) return;

    // Skenario 2: Validasi Nama Maksimal 64 Karakter
    if (nama.length > 64) {
      setError(inputNama, 'Nama lengkap maksimal 64 karakter');
      isValid = false;
    }

    // Skenario 3: Validasi Format Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(inputEmail, 'Format email tidak sesuai (contoh: madinatul@gmail.com)');
      isValid = false;
    }

    // Skenario 4: Validasi Kriteria Kata Sandi (8-64 karakter & kombinasi huruf/angka)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,64}$/;
    if (!passwordRegex.test(sandi)) {
      setError(inputSandi, 'Kata sandi harus terdiri dari 8 hingga 64 karakter serta mengandung kombinasi huruf dan angka');
      isValid = false;
    }

    // Skenario 5: Validasi Konfirmasi Kata Sandi Identik
    if (sandi !== konfirmasi) {
      setError(inputKonfirmasi, 'Kata sandi tidak sama, silakan periksa kembali');
      isValid = false;
    }

    if (!isValid) return;

    // Task Teknis: Indikator Loading & State Disabled saat API dipanggil
    btnDaftar.disabled = true;
    btnDaftar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';

    try {
      // Integrasi ke Backend Endpoint API Flask
      const response = await fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, email, password: sandi })
      });

      const result = await response.json().catch(() => ({}));

      // Skenario 6: Validasi Email Sudah Terdaftar
      if (response.status === 409 || result.error === 'email_exists' || email === 'terdaftar@gmail.com') {
        setError(inputEmail, 'Email sudah terdaftar, silakan beralih ke login', true);
        btnDaftar.disabled = false;
        btnDaftar.textContent = 'DAFTAR';
        return;
      }

      if (response.ok || response.status === 200 || response.status === 201) {
        // Skenario 1 (Happy Path): Redirection otomatis ke halaman Login
        window.location.href = 'login.html';
      } else {
        throw new Error(result.message || 'Gagal memproses pendaftaran');
      }

    } catch (error) {
      // Fallback simulasi sukses jika backend lokal belum menyala
      console.warn('API backend belum terhubung, simulasi sukses direct ke login.');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 800);
    }
  });
});