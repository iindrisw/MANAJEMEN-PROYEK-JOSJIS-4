import { readViewState, updateViewState } from "./view-state.js";
import {
  API_BASE_URL,
  isNetworkConnectionError,
  NETWORK_CONNECTION_ERROR_MESSAGE,
} from "./api.js";
import {
  blockUnsupportedCharacters,
  containsUnsupportedCharacter,
  PASSWORD_ERROR_MESSAGE,
} from "./input.js";

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

  fields.forEach((input) => {
    if (input instanceof HTMLInputElement) {
      blockUnsupportedCharacters(input, {
        message: PASSWORD_ERROR_MESSAGE,
        setError: (message) => setFieldError(input, message),
        clearError: () => clearFieldError(input),
      });
    }
  });

  function validatePasswordInputs(currentPass, newPass, confirmPass) {
    clearAllErrors();
    let isValid = true;

    fields.forEach((input) => {
      if (input instanceof HTMLInputElement && input.value.length === 0) {
        setFieldError(input, "Kolom ini wajib diisi");
        isValid = false;
      } else if (input instanceof HTMLInputElement && containsUnsupportedCharacter(input.value)) {
        setFieldError(input, PASSWORD_ERROR_MESSAGE);
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
        setFieldError(input, PASSWORD_ERROR_MESSAGE);
        isValid = false;
      }
    });
    if (!isValid) return false;

    const hasLettersAndNumbers =
      /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9]+$/.test(newPass);
    if (newPass.length < 8 || newPass.length > 64 || !hasLettersAndNumbers) {
      setFieldError(
        passwordNextInput,
        PASSWORD_ERROR_MESSAGE,
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

    if (
      !(passwordCurrentInput instanceof HTMLInputElement) ||
      !(passwordNextInput instanceof HTMLInputElement) ||
      !(passwordConfirmInput instanceof HTMLInputElement)
    ) {
      return;
    }

    const currentPass = passwordCurrentInput.value;
    const newPass = passwordNextInput.value;
    const confirmPass = passwordConfirmInput.value;
    if (!validatePasswordInputs(currentPass, newPass, confirmPass)) return;

    if (btnConfirmPassword instanceof HTMLButtonElement) {
      btnConfirmPassword.disabled = true;
      btnConfirmPassword.textContent = "Menyimpan...";
    }
    if (passwordForm instanceof HTMLFormElement) {
      passwordForm.setAttribute("aria-busy", "true");
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
      showFormError(
        isNetworkConnectionError(error)
          ? NETWORK_CONNECTION_ERROR_MESSAGE
          : error.message || "Terjadi kesalahan saat memperbarui kata sandi.",
      );
    } finally {
      if (btnConfirmPassword instanceof HTMLButtonElement) {
        btnConfirmPassword.disabled = false;
        btnConfirmPassword.textContent = "Simpan Kata Sandi";
      }
      if (passwordForm instanceof HTMLFormElement) {
        passwordForm.removeAttribute("aria-busy");
      }
    }
  }

  function resetForm() {
    if (passwordForm instanceof HTMLFormElement) {
      passwordForm.reset();
    }
    clearAllErrors();
    document.querySelectorAll("[data-password-target]").forEach((toggle) => {
      if (!(toggle instanceof HTMLElement)) return;
      const targetId = toggle.dataset.passwordTarget;
      const input = targetId ? document.getElementById(targetId) : null;
      if (input instanceof HTMLInputElement) input.type = "password";
      toggle.classList.remove("is-visible");
      toggle.setAttribute("aria-pressed", "false");
      toggle.setAttribute("aria-label", "Tampilkan kata sandi");
    });
  }

  function openPasswordPanel() {
    resetForm();
    if (passwordDialog instanceof HTMLDialogElement) {
      passwordDialog.show();
      if (profileTitle instanceof HTMLElement) {
        profileTitle.textContent = "UBAH KATA SANDI";
      }
    }
    updateViewState({ panel: "password" });
    if (passwordCurrentInput instanceof HTMLInputElement) {
      passwordCurrentInput.focus();
    }
  }

  function closePasswordPanel() {
    if (passwordDialog instanceof HTMLDialogElement && passwordDialog.open) {
      passwordDialog.close();
    }
  }

  window.addEventListener("recipe:navigate-home", closePasswordPanel);
  window.addEventListener("recipe:navigate-saved", closePasswordPanel);

  btnChangePassword?.addEventListener("click", () => {
    if (!localStorage.getItem("token")) {
      if (guestModal instanceof HTMLDialogElement && !guestModal.open) {
        guestModal.showModal();
      }
      return;
    }
    openPasswordPanel();
  });

  btnCancelPassword?.addEventListener("click", () => {
    if (passwordDialog instanceof HTMLDialogElement) passwordDialog.close();
  });

  passwordDialog?.addEventListener("close", () => {
    updateViewState({ panel: null });
    resetForm();
    if (profileTitle instanceof HTMLElement) {
      profileTitle.textContent = defaultProfileTitle;
    }
  });
  passwordForm?.addEventListener("submit", (event) => {
    void handlePasswordSubmit(event);
  });

  document.querySelectorAll("[data-password-target]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      if (!(toggle instanceof HTMLElement)) return;
      const targetId = toggle.dataset.passwordTarget;
      const input = targetId ? document.getElementById(targetId) : null;
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

  // Pulihkan form ubah kata sandi setelah refresh (?view=profile&panel=password).
  // initProfile sudah memulihkan halaman profilnya lebih dulu (urutan di main.js).
  if (readViewState().panel === "password") {
    if (localStorage.getItem("token")) {
      openPasswordPanel();
    } else {
      updateViewState({ panel: null });
    }
  }
}