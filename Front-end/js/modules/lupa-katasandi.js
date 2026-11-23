import {
  API_BASE_URL,
  isNetworkConnectionError,
  NETWORK_CONNECTION_ERROR_MESSAGE,
} from "./api.js";
import {
  blockUnsupportedCharacters,
  containsUnsupportedCharacter,
  containsUnsupportedEmailCharacter,
  EMAIL_ERROR_MESSAGE,
  PASSWORD_ERROR_MESSAGE,
} from "./input.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#forgotPasswordForm");
  const emailInput = document.querySelector("#resetEmail");
  const nameInput = document.querySelector("#resetName");
  const passwordInput = document.querySelector("#resetPassword");
  const confirmInput = document.querySelector("#confirmPassword");
  const status = document.querySelector("#resetStatus");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (
    !(form instanceof HTMLFormElement) ||
    !(emailInput instanceof HTMLInputElement) ||
    !(nameInput instanceof HTMLInputElement) ||
    !(passwordInput instanceof HTMLInputElement) ||
    !(confirmInput instanceof HTMLInputElement) ||
    !(status instanceof HTMLElement)
  ) {
    throw new Error("Elemen formulir lupa kata sandi tidak ditemukan.");
  }

  const fields = [emailInput, nameInput, passwordInput, confirmInput];

  function setError(input, message) {
    const field = input.closest(".reset-field");
    const error = document.querySelector(`#${input.id}Error`);
    field?.classList.add("has-error");
    input.setAttribute("aria-invalid", "true");
    if (error instanceof HTMLElement) {
      error.textContent = message;
      error.classList.toggle("is-long", message.length > 64);
    }
  }

  function clearError(input) {
    const field = input.closest(".reset-field");
    const error = document.querySelector(`#${input.id}Error`);
    field?.classList.remove("has-error");
    input.removeAttribute("aria-invalid");
    if (error instanceof HTMLElement) {
      error.textContent = "";
      error.classList.remove("is-long");
    }
  }

  blockUnsupportedCharacters(emailInput, {
    message: EMAIL_ERROR_MESSAGE,
    setError: (message) => setError(emailInput, message),
    clearError: () => clearError(emailInput),
    isEmailIdentifier: true,
  });
  blockUnsupportedCharacters(passwordInput, {
    message: PASSWORD_ERROR_MESSAGE,
    setError: (message) => setError(passwordInput, message),
    clearError: () => clearError(passwordInput),
  });
  blockUnsupportedCharacters(confirmInput, {
    message: PASSWORD_ERROR_MESSAGE,
    setError: (message) => setError(confirmInput, message),
    clearError: () => clearError(confirmInput),
  });

  function clearAllErrors() {
    fields.forEach(clearError);
    updateValidationExpansion();
  }

  function updateValidationExpansion() {
    const longErrorCount = form.querySelectorAll(".field-error.is-long").length;
    form.style.setProperty(
      "--validation-expansion",
      `${longErrorCount * 12}px`,
    );
  }

  function clearStatus() {
    status.textContent = "";
    status.hidden = true;
    status.classList.remove("is-success", "is-error");
  }

  function showStatus(message, type = "error") {
    status.textContent = message;
    status.hidden = false;
    status.classList.remove("is-success", "is-error");
    status.classList.add(type === "success" ? "is-success" : "is-error");
  }

  function applyBackendError(result) {
    const message =
      result?.message ||
      "Data akun tidak ditemukan, silakan periksa kembali nama dan email Anda";
    const code = result?.code;

    switch (code) {
      case "NAMA_TERLALU_PANJANG":
        setError(nameInput, message);
        break;
      case "EMAIL_TIDAK_VALID":
        setError(emailInput, EMAIL_ERROR_MESSAGE);
        break;
      case "PASSWORD_MENGANDUNG_SPASI":
        setError(passwordInput, PASSWORD_ERROR_MESSAGE);
        break;
      case "PASSWORD_TIDAK_MEMENUHI_KRITERIA":
        setError(passwordInput, PASSWORD_ERROR_MESSAGE);
        break;
      case "KONFIRMASI_PASSWORD_TIDAK_COCOK":
        setError(confirmInput, message);
        break;
      default:
        showStatus(message, "error");
        return;
    }

    updateValidationExpansion();
  }

  fields.forEach((input) => {
    input.addEventListener("input", () => {
      updateValidationExpansion();
      clearStatus();
    });
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    fields.forEach(clearError);
    clearStatus();

    const enteredEmail = emailInput.value.trim();
    const email = enteredEmail.toLowerCase();
    const name = nameInput.value.trim();
    const password = passwordInput.value;
    const confirmation = confirmInput.value;
    let isValid = true;

    if (!email) {
      setError(emailInput, "Kolom ini wajib diisi");
      isValid = false;
    } else if (
      containsUnsupportedEmailCharacter(enteredEmail) ||
      email.length > 100 ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    ) {
      setError(
        emailInput,
        EMAIL_ERROR_MESSAGE,
      );
      isValid = false;
    }

    if (!name) {
      setError(nameInput, "Kolom ini wajib diisi");
      isValid = false;
    } else if (name.length > 64) {
      setError(nameInput, "Nama Lengkap maksimal 64 karakter");
      isValid = false;
    }

    if (!password) {
      setError(passwordInput, "Kolom ini wajib diisi");
      isValid = false;
    } else if (containsUnsupportedCharacter(password)) {
      setError(passwordInput, PASSWORD_ERROR_MESSAGE);
      isValid = false;
    } else if (/\s/.test(password)) {
      setError(passwordInput, PASSWORD_ERROR_MESSAGE);
      isValid = false;
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,64}$/.test(password)) {
      setError(
        passwordInput,
        PASSWORD_ERROR_MESSAGE,
      );
      isValid = false;
    }

    if (!confirmation) {
      setError(confirmInput, "Kolom ini wajib diisi");
      isValid = false;
    } else if (containsUnsupportedCharacter(confirmation)) {
      setError(confirmInput, PASSWORD_ERROR_MESSAGE);
      isValid = false;
    } else if (/\s/.test(confirmation)) {
      setError(confirmInput, PASSWORD_ERROR_MESSAGE);
      isValid = false;
    } else if (password !== confirmation) {
      setError(
        confirmInput,
        "Konfirmasi kata sandi tidak cocok, silakan periksa kembali",
      );
      isValid = false;
    }

    updateValidationExpansion();
    if (!isValid) return;

    if (!(submitButton instanceof HTMLButtonElement)) return;

    submitButton.disabled = true;
    submitButton.textContent = "MEMPROSES...";
    form.setAttribute("aria-busy", "true");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          nama: name,
          password_baru: password,
          konfirmasi_password: confirmation,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result || result.status !== "success") {
        const message =
          result?.message || "Gagal memperbarui kata sandi. Silakan coba lagi.";
        const code = result?.code;
        const displayMessage =
          code === "EMAIL_TIDAK_VALID"
            ? EMAIL_ERROR_MESSAGE
            : code === "PASSWORD_MENGANDUNG_SPASI" ||
                code === "PASSWORD_TIDAK_MEMENUHI_KRITERIA"
              ? PASSWORD_ERROR_MESSAGE
              : message;

        if (code === "EMAIL_TIDAK_VALID") {
          setError(emailInput, EMAIL_ERROR_MESSAGE);
        } else if (code === "KOLOM_WAJIB_DIISI") {
          if (!emailInput.value.trim()) setError(emailInput, message);
          if (!nameInput.value.trim()) setError(nameInput, message);
          if (!passwordInput.value) setError(passwordInput, message);
          if (!confirmInput.value) setError(confirmInput, message);
        } else if (code === "NAMA_TERLALU_PANJANG") {
          setError(nameInput, message);
        } else if (
          code === "PASSWORD_MENGANDUNG_SPASI" ||
          code === "PASSWORD_TIDAK_MEMENUHI_KRITERIA"
        ) {
          setError(passwordInput, PASSWORD_ERROR_MESSAGE);
        } else if (code === "KONFIRMASI_PASSWORD_TIDAK_COCOK") {
          setError(confirmInput, message);
        } else if (code === "AKUN_TIDAK_DITEMUKAN") {
          setError(emailInput, message);
          setError(nameInput, message);
        }

        status.textContent = displayMessage;
        status.hidden = false;
        return;
      }

      status.textContent =
        result.message ||
        "Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.";
      status.hidden = false;

      window.setTimeout(() => {
        window.location.assign("login.html");
      }, 1200);
    } catch (error) {
      console.error("Gagal menghubungi server:", error);
      status.textContent = isNetworkConnectionError(error)
        ? NETWORK_CONNECTION_ERROR_MESSAGE
        : "Tidak dapat terhubung ke server. Periksa koneksi dan coba lagi.";
      status.hidden = false;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "SIMPAN KATA SANDI BARU";
      form.removeAttribute("aria-busy");
    }
  });
});