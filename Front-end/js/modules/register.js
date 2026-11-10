const API_BASE_URL = "http://127.0.0.1:5000/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#registerForm");
  const inputName = document.querySelector("#registerNama");
  const inputEmail = document.querySelector("#registerEmail");
  const inputPassword = document.querySelector("#registerSandi");
  const inputConfirmation = document.querySelector("#registerKonfirmasi");
  const submitButton = document.querySelector("#btnDaftar");
  const noticeDialog = document.querySelector("#register-notice-dialog");
  const noticeMessage = document.querySelector("#register-notice-message");
  const noticeDismiss = document.querySelector("#register-notice-dismiss");
  const modalValidationMessages = new Set([
    "Nama Lengkap maksimal 64 karakter",
    "Kata sandi tidak sama, silakan periksa kembali",
    "Email sudah terdaftar, silakan beralih ke login",
  ]);

  if (
    !(form instanceof HTMLFormElement) ||
    !(inputName instanceof HTMLInputElement) ||
    !(inputEmail instanceof HTMLInputElement) ||
    !(inputPassword instanceof HTMLInputElement) ||
    !(inputConfirmation instanceof HTMLInputElement) ||
    !(submitButton instanceof HTMLButtonElement)
  ) {
    throw new Error("Elemen formulir pendaftaran tidak ditemukan.");
  }

  function setError(input, message) {
    const group = input.closest(".form-group");
    const errorMessage = group?.querySelector(".error-message");
    group?.classList.add("error");
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.classList.toggle(
        "is-long",
        message.includes("tidak boleh mengandung spasi"),
      );
    }
    if (
      modalValidationMessages.has(message) &&
      noticeDialog instanceof HTMLDialogElement &&
      noticeMessage instanceof HTMLElement &&
      !noticeDialog.open
    ) {
      noticeMessage.textContent = message;
      noticeDialog.showModal();
    }
  }

  if (noticeDismiss && noticeDialog instanceof HTMLDialogElement) {
    noticeDismiss.addEventListener("click", () => noticeDialog.close());
  }

  function clearError(input) {
    const group = input.closest(".form-group");
    const errorMessage = group?.querySelector(".error-message");
    group?.classList.remove("error");
    if (errorMessage) {
      errorMessage.textContent = "";
      errorMessage.classList.remove("is-long");
    }
  }

  for (const input of [
    inputName,
    inputEmail,
    inputPassword,
    inputConfirmation,
  ]) {
    input.addEventListener("input", () => {
      clearError(input);
    });
  }

  for (const button of document.querySelectorAll(".toggle-password")) {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.target);
      const icon = button.querySelector("i");
      if (!(target instanceof HTMLInputElement) || !icon) return;

      const showPassword = target.type === "password";
      target.type = showPassword ? "text" : "password";
      icon.classList.toggle("fa-eye", !showPassword);
      icon.classList.toggle("fa-eye-slash", showPassword);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Disable tombol sementara saat proses berjalan
    submitButton.disabled = true;
    submitButton.textContent = "MEMPROSES...";

    const nama = inputName.value.trim();
    const email = inputEmail.value.trim().toLowerCase();
    const password = inputPassword.value;
    const confirmation = inputConfirmation.value;
    let isValid = true;

    // Bersihkan semua error sebelumnya sebelum validasi ulang
    clearError(inputName);
    clearError(inputEmail);
    clearError(inputPassword);
    clearError(inputConfirmation);

    // 1. Validasi Nama
    if (!nama) {
      setError(inputName, "Kolom ini wajib diisi");
      isValid = false;
    } else if (nama.length > 64) {
<<<<<<< HEAD
      setError(inputName, "Nama Lengkap maksimal 64 karakter");
=======
      setError(inputName, "Nama maksimal 64 karakter.");
>>>>>>> ea9b487fa2ea25c7a6417f9b30ad494e243fc720
      isValid = false;
    }

    // 2. Validasi Email (Format lokal)
    if (!email) {
      setError(inputEmail, "Kolom ini wajib diisi");
      isValid = false;
    } else if (
      email.length > 100 ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    ) {
      setError(inputEmail, "Format email tidak sesuai (contoh: madinatul@gmail.com)");
      isValid = false;
    }

    // 3. Validasi Kata Sandi
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,64}$/;
    if (!password) {
      setError(inputPassword, "Kolom ini wajib diisi");
      isValid = false;
    } else if (/\s/.test(password)) {
      setError(inputPassword, "Kata sandi tidak boleh mengandung spasi");
      isValid = false;
    } else if (!passwordRegex.test(password)) {
      setError(inputPassword, "Kata sandi harus terdiri dari 8 hingga 64 karakter serta mengandung kombinasi huruf dan angka");
      isValid = false;
    }

    // 4. Validasi Konfirmasi Kata Sandi
    if (!confirmation) {
      setError(inputConfirmation, "Kolom ini wajib diisi");
      isValid = false;
    } else if (password !== confirmation) {
      setError(inputConfirmation, "Kata sandi tidak sama, silakan periksa kembali");
      isValid = false;
    }

    // 5. Cek ke Server (Email Duplikat) secara bersamaan jika format email valid
    let isEmailConflict = false;
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama, email, password }),
        });
        const result = await response.json().catch(() => null);

        if (result && (response.status === 409 || result.code === "EMAIL_SUDAH_ADA")) {
          setError(inputEmail, "Email sudah terdaftar, silakan beralih ke login");
          isEmailConflict = true;
          isValid = false;
        } else if (!response.ok && result && result.status !== "success" && !isEmailConflict) {
          console.warn("Pesan server:", result.message);
        }
      } catch (error) {
        console.error("Gagal menghubungi server:", error);
      }
    }

    // Jika ada error dari validasi lokal ATAU konflik email dari server, stop dan tampilkan semua barengan
    if (!isValid) {
      submitButton.disabled = false;
      submitButton.textContent = "DAFTAR";
      return;
    }

    // Jika lolos semua validasi lokal & server, arahkan ke login
    window.location.assign("login.html");
  });
});