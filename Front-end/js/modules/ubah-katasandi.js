const API_BASE_URL = "http://127.0.0.1:5000/api";

export function initUbahKataSandi() {
  const passwordDialog = document.querySelector("#profile-password-dialog");
  const btnChangePassword = document.querySelector("#btn-ubah-sandi");
  const btnCancelPassword = document.querySelector("#btn-cancel-password");
  const btnConfirmPassword = document.querySelector("#btn-confirm-password");

  // Input elements
  const passwordCurrentInput = document.querySelector("#profile-password-current");
  const passwordNextInput = document.querySelector("#profile-password-next");
  const passwordConfirmInput = document.querySelector("#profile-password-confirm") || createConfirmInputIfNeeded();

  // Helper untuk membuka dialog/modal
  function openDialog(dialog) {
    if (dialog instanceof HTMLDialogElement && !dialog.open) {
      dialog.showModal();
    }
  }

  // Membuat elemen error message / bantuan di bawah input jika belum ada
  function ensureErrorElements() {
    [passwordCurrentInput, passwordNextInput, passwordConfirmInput].forEach(input => {
      if (input && !input.parentNode.querySelector(".error-message")) {
        const errorEl = document.createElement("small");
        errorEl.className = "error-message";
        errorEl.style.cssText = "color: #d05755; font-size: 12px; margin-top: 4px; display: none;";
        input.parentNode.appendChild(errorEl);
      }
    });
  }
  ensureErrorElements();

  // Helper untuk menampilkan error pada field tertentu (Skenario 2, 4, 5, 6)
  function setFieldError(input, message) {
    if (!input) return;
    input.style.borderColor = "#d05755";
    input.style.borderWidth = "2px";
    input.style.borderStyle = "solid";
    
    const errorEl = input.parentNode.querySelector(".error-message");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
    }
  }

  // Helper untuk mereset error pada field
  function clearFieldError(input) {
    if (!input) return;
    input.style.borderColor = "";
    input.style.borderWidth = "";
    input.style.borderStyle = "";
    
    const errorEl = input.parentNode.querySelector(".error-message");
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.style.display = "none";
    }
  }

  function clearAllErrors() {
    clearFieldError(passwordCurrentInput);
    clearFieldError(passwordNextInput);
    clearFieldError(passwordConfirmInput);
  }

  // Fungsi validasi kriteria Password Baru (Skenario 2 & 4)
  // Skenario 2: Tidak boleh mengandung spasi
  // Skenario 4: 8 hingga 64 karakter & mengandung kombinasi huruf dan angka
  function validatePasswordInputs(currentPass, newPass, confirmPass) {
    let isValid = true;

    clearAllErrors();

    // Skenario 6: Kolom wajib kosong (Required Fields)
    if (!currentPass) {
      setFieldError(passwordCurrentInput, "Kolom ini wajib diisi");
      isValid = false;
    }
    if (!newPass) {
      setFieldError(passwordNextInput, "Kolom ini wajib diisi");
      isValid = false;
    }
    if (!confirmPass) {
      setFieldError(passwordConfirmInput, "Kolom ini wajib diisi");
      isValid = false;
    }

    if (!isValid) return false;

    // Skenario 2: Deteksi dan penolakan spasi
    if (/\s/.test(currentPass)) {
      setFieldError(passwordCurrentInput, "Kata sandi tidak boleh mengandung spasi");
      isValid = false;
    }
    if (/\s/.test(newPass)) {
      setFieldError(passwordNextInput, "Kata sandi tidak boleh mengandung spasi");
      isValid = false;
    }
    if (/\s/.test(confirmPass)) {
      setFieldError(passwordConfirmInput, "Kata sandi tidak boleh mengandung spasi");
      isValid = false;
    }

    if (!isValid) return false;

    // Skenario 4: Panjang 8-64 karakter & kombinasi huruf + angka
    const regexKombinasi = /^(?=.*[a-zA-Z])(?=.*\d).+$/;
    if (newPass.length < 8 || newPass.length > 64 || !regexKombinasi.test(newPass)) {
      setFieldError(
        passwordNextInput,
        "Kata sandi harus terdiri dari 8 hingga 64 karakter dan hanya mengandung kombinasi huruf dan angka"
      );
      isValid = false;
    }

    // Skenario 5: Konfirmasi kata sandi baru tidak sama
    if (newPass !== confirmPass) {
      setFieldError(passwordConfirmInput, "Konfirmasi kata sandi tidak cocok, silakan periksa kembali");
      isValid = false;
    }

    return isValid;
  }

  // Integrasi API Pembaruan Kata Sandi
  async function handleUbahPasswordSubmit() {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sesi berakhir, silakan masuk kembali.");
      return;
    }

    const currentPass = passwordCurrentInput?.value || "";
    const newPass = passwordNextInput?.value || "";
    const confirmPass = passwordConfirmInput?.value || "";

    // Jalankan validasi frontend sebelum hit API
    if (!validatePasswordInputs(currentPass, newPass, confirmPass)) {
      return;
    }

    // Task Teknis: Interaksi tombol "Simpan Kata Sandi" (disabled & loading state)
    if (btnConfirmPassword) {
      btnConfirmPassword.disabled = true;
      btnConfirmPassword.textContent = "Menyimpan...";
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password_lama: currentPass,
          password_baru: newPass,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.status === "error") {
        // Skenario 3: Validasi kata sandi lama salah dari server
        const errorMsg = result.message || "";
        if (errorMsg.toLowerCase().includes("lama") || errorMsg.toLowerCase().includes("salah")) {
          setFieldError(passwordCurrentInput, "Kata sandi lama salah, silakan periksa kembali");
        } else {
          throw new Error(errorMsg || "Gagal memperbarui kata sandi.");
        }
        return;
      }

      // Skenario 1: Berhasil dengan data valid -> Muncul pesan & Tombol "Oke Mengerti"
      showSuccessModal();

      if (passwordDialog instanceof HTMLDialogElement) {
        passwordDialog.close();
      }
      
      // Reset form
      if (passwordCurrentInput) passwordCurrentInput.value = "";
      if (passwordNextInput) passwordNextInput.value = "";
      if (passwordConfirmInput) passwordConfirmInput.value = "";
      clearAllErrors();

    } catch (error) {
      console.error("Error ubah kata sandi:", error);
      alert(error.message || "Terjadi kesalahan pada sistem.");
    } finally {
      if (btnConfirmPassword) {
        btnConfirmPassword.disabled = false;
        btnConfirmPassword.textContent = "Simpan Kata Sandi";
      }
    }
  }

  // Popup Modal Sukses (Skenario 1: "Kata sandi berhasil diperbarui" & "Oke Mengerti")
  function showSuccessModal() {
    let successModal = document.querySelector("#password-success-modal");
    if (!successModal) {
      successModal = document.createElement("dialog");
      successModal.id = "password-success-modal";
      successModal.className = "profile-dialog";
      successModal.innerHTML = `
        <div class="profile-edit-card" style="text-align: center; display: flex; flex-direction: column; justify-content: space-between; height: 220px;">
          <h3 style="margin-top: 10px; font-family: var(--font-heading); font-size: 20px;">Informasi</h3>
          <p style="font-family: var(--font-body); font-size: 16px; margin: 0;">Kata sandi berhasil diperbarui</p>
          <button type="button" id="btn-success-ok" class="profile-dialog-button" style="width: 100%;">Oke Mengerti</button>
        </div>
      `;
      document.body.appendChild(successModal);

      successModal.querySelector("#btn-success-ok").addEventListener("click", () => {
        successModal.close();
      });
    }
    successModal.showModal();
  }

  // Helper membuat input konfirmasi jika di HTML belum ada
  function createConfirmInputIfNeeded() {
    if (!passwordNextInput) return null;
    let confirmInput = document.querySelector("#profile-password-confirm");
    if (!confirmInput && passwordNextInput.parentNode) {
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "display: flex; flex-direction: column; gap: 6px; margin-top: 12px;";
      wrapper.innerHTML = `
        <label class="info-label" for="profile-password-confirm">Konfirmasi Kata Sandi Baru</label>
        <div style="position: relative; display: flex; align-items: center;">
          <input type="password" id="profile-password-confirm" class="profile-dialog-input" style="position: static; width: 100%;" placeholder="Masukkan ulang kata sandi baru" />
        </div>
      `;
      passwordNextInput.parentNode.parentNode.appendChild(wrapper);
      confirmInput = wrapper.querySelector("#profile-password-confirm");
    }
    return confirmInput;
  }

  // Skenario 7: Toggle Visibility (Menampilkan dan Menyembunyikan Kata Sandi dengan Ikon Mata)
  document.querySelectorAll("[data-password-target]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const targetId = toggle.dataset.passwordTarget;
      const input = document.getElementById(targetId);
      if (!(input instanceof HTMLInputElement)) return;

      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      toggle.setAttribute("aria-pressed", String(!isVisible));
      
      // Ubah ikon atau teks penanda jika diperlukan
      toggle.textContent = isVisible ? "👁️" : "🔒"; 
    });
  });

  // Event Listeners Tombol Utama
  if (btnChangePassword) {
    btnChangePassword.addEventListener("click", () => {
      if (!localStorage.getItem("token")) {
        return;
      }
      clearAllErrors();
      if (passwordCurrentInput) passwordCurrentInput.value = "";
      if (passwordNextInput) passwordNextInput.value = "";
      if (passwordConfirmInput) passwordConfirmInput.value = "";
      openDialog(passwordDialog);
      passwordCurrentInput?.focus();
    });
  }

  if (btnCancelPassword) {
    btnCancelPassword.addEventListener("click", () => {
      if (passwordDialog instanceof HTMLDialogElement) {
        passwordDialog.close();
      }
    });
  }

  if (btnConfirmPassword) {
    btnConfirmPassword.addEventListener("click", (e) => {
      e.preventDefault();
      void handleUbahPasswordSubmit();
    });
  }
}