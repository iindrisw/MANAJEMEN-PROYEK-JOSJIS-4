const API_BASE_URL = "http://127.0.0.1:5000/api";

export function initUbahKataSandi() {
  const passwordDialog = document.querySelector("#profile-password-dialog");
  const passwordForm = document.querySelector("#profile-password-form");
  const btnChangePassword = document.querySelector("#btn-ubah-sandi");
  const profileTitle = document.querySelector("#view-profile .profile-title");
  const defaultProfileTitle = profileTitle?.textContent?.trim() || "PROFILE";
  const btnCancelPassword = document.querySelector("#btn-cancel-password");
  const btnConfirmPassword = document.querySelector("#btn-confirm-password");
  const passwordCurrentInput = document.querySelector("#profile-password-current");
  const passwordNextInput = document.querySelector("#profile-password-next");
  const passwordConfirmInput = document.querySelector("#profile-password-confirm");
  const passwordFormError = document.querySelector("#profile-password-form-error");
  const successModal = document.querySelector("#password-success-modal");
  const btnSuccessOk = document.querySelector("#btn-success-ok");
  const guestModal = document.querySelector("#guest-modal");
  const fields = [
    passwordCurrentInput,
    passwordNextInput,
    passwordConfirmInput,
  ];

  function setFieldError(input, message) {
    if (!(input instanceof HTMLInputElement)) return;
    const error = document.querySelector(`#${input.id}-error`);
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    if (error instanceof HTMLElement) {
      error.textContent = message;
      error.hidden = false;
    }
  }

  function clearFieldError(input) {
    if (!(input instanceof HTMLInputElement)) return;
    const error = document.querySelector(`#${input.id}-error`);
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    if (error instanceof HTMLElement) {
      error.textContent = "";
      error.hidden = true;
    }
  }

  function clearFormError() {
    if (passwordFormError instanceof HTMLElement) {
      passwordFormError.textContent = "";
      passwordFormError.hidden = true;
    }
  }

  function clearAllErrors() {
    fields.forEach(clearFieldError);
    clearFormError();
  }

  function validatePasswordInputs(currentPass, newPass, confirmPass) {
    clearAllErrors();
    let isValid = true;

    fields.forEach((input) => {
      if (input instanceof HTMLInputElement && input.value.length === 0) {
        setFieldError(input, "Kolom ini wajib diisi");
        isValid = false;
      }
    });
    if (!isValid) return false;

    const values = [
      [passwordCurrentInput, currentPass],
      [passwordNextInput, newPass],
      [passwordConfirmInput, confirmPass],
    ];
    values.forEach(([input, value]) => {
      if (/\s/.test(value)) {
        setFieldError(input, "Kata sandi tidak boleh mengandung spasi");
        isValid = false;
      }
    });
    if (!isValid) return false;

    const hasLettersAndNumbers =
      /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9]+$/.test(newPass);
    if (newPass.length < 8 || newPass.length > 64 || !hasLettersAndNumbers) {
      setFieldError(
        passwordNextInput,
        "Kata sandi harus terdiri dari 8 hingga 64 karakter dan hanya mengandung kombinasi huruf dan angka",
      );
      isValid = false;
    }
    if (newPass !== confirmPass) {
      setFieldError(
        passwordConfirmInput,
        "Konfirmasi kata sandi tidak cocok, silakan periksa kembali",
      );
      isValid = false;
    }
    return isValid;
  }

  function showFormError(message) {
    if (passwordFormError instanceof HTMLElement) {
      passwordFormError.textContent = message;
      passwordFormError.hidden = false;
    }
  }

  function isWrongCurrentPassword(message) {
    const normalizedMessage = message.toLowerCase();
    return (
      normalizedMessage.includes("lama") ||
      normalizedMessage.includes("wrong password") ||
      normalizedMessage.includes("incorrect password")
    );
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      if (passwordDialog instanceof HTMLDialogElement) passwordDialog.close();
      if (guestModal instanceof HTMLDialogElement && !guestModal.open) {
        guestModal.showModal();
      }
      return;
    }

    const currentPass = passwordCurrentInput.value;
    const newPass = passwordNextInput.value;
    const confirmPass = passwordConfirmInput.value;
    if (!validatePasswordInputs(currentPass, newPass, confirmPass)) return;

    btnConfirmPassword.disabled = true;
    btnConfirmPassword.textContent = "Menyimpan...";
    passwordForm.setAttribute("aria-busy", "true");

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
        const message = result.message || "Gagal memperbarui kata sandi.";
        if (isWrongCurrentPassword(message)) {
          setFieldError(
            passwordCurrentInput,
            "Kata sandi lama salah, silakan periksa kembali",
          );
        } else {
          showFormError(message);
        }
        return;
      }

      if (passwordDialog instanceof HTMLDialogElement) passwordDialog.close();
      if (successModal instanceof HTMLDialogElement) successModal.showModal();
    } catch (error) {
      console.error("Gagal mengubah kata sandi:", error);
      showFormError(error.message || "Terjadi kesalahan saat memperbarui kata sandi.");
    } finally {
      btnConfirmPassword.disabled = false;
      btnConfirmPassword.textContent = "Simpan Kata Sandi";
      passwordForm.removeAttribute("aria-busy");
    }
  }

  function resetForm() {
    passwordForm.reset();
    clearAllErrors();
    document.querySelectorAll("[data-password-target]").forEach((toggle) => {
      const input = document.getElementById(toggle.dataset.passwordTarget);
      if (input instanceof HTMLInputElement) input.type = "password";
      toggle.classList.remove("is-visible");
      toggle.setAttribute("aria-pressed", "false");
      toggle.setAttribute("aria-label", "Tampilkan kata sandi");
    });
  }

  btnChangePassword?.addEventListener("click", () => {
    if (!localStorage.getItem("token")) {
      if (guestModal instanceof HTMLDialogElement && !guestModal.open) {
        guestModal.showModal();
      }
      return;
    }
    resetForm();
    if (passwordDialog instanceof HTMLDialogElement) {
      passwordDialog.show();
      if (profileTitle instanceof HTMLElement) {
        profileTitle.textContent = "UBAH KATA SANDI";
      }
    }
    passwordCurrentInput.focus();
  });

  btnCancelPassword?.addEventListener("click", () => {
    if (passwordDialog instanceof HTMLDialogElement) passwordDialog.close();
  });

  passwordDialog?.addEventListener("close", () => {
    resetForm();
    if (profileTitle instanceof HTMLElement) {
      profileTitle.textContent = defaultProfileTitle;
    }
  });
  passwordForm?.addEventListener("submit", (event) => {
    void handlePasswordSubmit(event);
  });

  fields.forEach((input) => input?.addEventListener("input", () => {
    clearFieldError(input);
    clearFormError();
  }));

  document.querySelectorAll("[data-password-target]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = document.getElementById(toggle.dataset.passwordTarget);
      if (!(input instanceof HTMLInputElement)) return;

      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      toggle.classList.toggle("is-visible", !isVisible);
      toggle.setAttribute("aria-pressed", String(!isVisible));
      toggle.setAttribute(
        "aria-label",
        isVisible ? "Tampilkan kata sandi" : "Sembunyikan kata sandi",
      );
    });
  });

  btnSuccessOk?.addEventListener("click", () => {
    if (successModal instanceof HTMLDialogElement) successModal.close();
  });
}
