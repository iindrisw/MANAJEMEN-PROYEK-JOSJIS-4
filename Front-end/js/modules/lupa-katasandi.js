const EMAIL_EMOJI_PATTERN =
  /[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\u200D\uFE0E\uFE0F\u20E3]/gu;

function removeEmailEmoji(value) {
  return value.replace(EMAIL_EMOJI_PATTERN, "");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#forgotPasswordForm");
  const emailInput = document.querySelector("#resetEmail");
  const nameInput = document.querySelector("#resetName");
  const passwordInput = document.querySelector("#resetPassword");
  const confirmInput = document.querySelector("#confirmPassword");
  const status = document.querySelector("#resetStatus");

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
  }

  fields.forEach((input) => {
    input.addEventListener("input", () => {
      clearError(input);
      clearStatus();
    });
  });

  document.querySelectorAll("[data-password-target]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = document.getElementById(toggle.dataset.passwordTarget);
      if (!(input instanceof HTMLInputElement)) return;

      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      toggle.setAttribute("aria-pressed", String(!isVisible));
      toggle.setAttribute(
        "aria-label",
        isVisible ? "Tampilkan kata sandi" : "Sembunyikan kata sandi",
      );
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    fields.forEach(clearError);
    clearStatus();

    const enteredEmail = emailInput.value.trim();
    const sanitizedEmail = removeEmailEmoji(enteredEmail);
    const email = sanitizedEmail.toLowerCase();
    const name = nameInput.value.trim();
    const password = passwordInput.value;
    const confirmation = confirmInput.value;
    let isValid = true;

    if (!email) {
      setError(emailInput, "Kolom ini wajib diisi");
      isValid = false;
    } else if (
      enteredEmail !== sanitizedEmail ||
      email.length > 100 ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    ) {
      emailInput.value = sanitizedEmail;
      setError(
        emailInput,
        "Format email tidak sesuai (contoh: madinatul@gmail.com)",
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
    } else if (/\s/.test(password)) {
      setError(passwordInput, "Kata sandi tidak boleh mengandung spasi");
      isValid = false;
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,64}$/.test(password)) {
      setError(
        passwordInput,
        "Kata sandi harus terdiri dari 8 hingga 64 karakter dan hanya mengandung kombinasi huruf dan angka",
      );
      isValid = false;
    }

    if (!confirmation) {
      setError(confirmInput, "Kolom ini wajib diisi");
      isValid = false;
    } else if (/\s/.test(confirmation)) {
      setError(confirmInput, "Kata sandi tidak boleh mengandung spasi");
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

    status.textContent =
      "Layanan pemulihan kata sandi belum tersedia. Silakan coba lagi nanti.";
    status.hidden = false;
  });
});
