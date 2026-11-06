const API_BASE_URL = "http://127.0.0.1:5000/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#registerForm");
  const inputName = document.querySelector("#registerNama");
  const inputEmail = document.querySelector("#registerEmail");
  const inputPassword = document.querySelector("#registerSandi");
  const inputConfirmation = document.querySelector("#registerKonfirmasi");
  const submitButton = document.querySelector("#btnDaftar");

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

  function setError(input, message, showLoginLink = false) {
    const group = input.closest(".form-group");
    const errorMessage = group?.querySelector(".error-message");
    group?.classList.add("error");

    if (errorMessage) {
      if (showLoginLink) {
        errorMessage.replaceChildren(
          document.createTextNode(`${message} `),
        );
        const link = document.createElement("a");
        link.href = "login.html";
        link.textContent = "Login di sini";
        errorMessage.append(link);
      } else {
        errorMessage.textContent = message;
      }
    }
  }

  function clearError(input) {
    const group = input.closest(".form-group");
    const errorMessage = group?.querySelector(".error-message");
    group?.classList.remove("error");
    if (errorMessage) errorMessage.textContent = "";
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

    const nama = inputName.value.trim();
    const email = inputEmail.value.trim().toLowerCase();
    const password = inputPassword.value;
    const confirmation = inputConfirmation.value;
    let isValid = true;

    if (!nama) {
      setError(inputName, "Nama wajib diisi.");
      isValid = false;
    } else if (nama.length > 100) {
      setError(inputName, "Nama maksimal 100 karakter.");
      isValid = false;
    }

    if (!email) {
      setError(inputEmail, "Email wajib diisi.");
      isValid = false;
    } else if (
      email.length > 100 ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    ) {
      setError(inputEmail, "Format email tidak valid.");
      isValid = false;
    }

    if (!password) {
      setError(inputPassword, "Kata sandi wajib diisi.");
      isValid = false;
    } else if (password.length < 8) {
      setError(inputPassword, "Kata sandi minimal 8 karakter.");
      isValid = false;
    }

    if (!confirmation) {
      setError(inputConfirmation, "Konfirmasi kata sandi wajib diisi.");
      isValid = false;
    } else if (password !== confirmation) {
      setError(inputConfirmation, "Kata sandi tidak sama.");
      isValid = false;
    }

    if (!isValid) return;

    submitButton.disabled = true;
    submitButton.textContent = "MEMPROSES...";

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, email, password }),
      });
      const result = await response.json().catch(() => null);

      if (!result || typeof result !== "object") {
        throw new Error("Respons server tidak valid. Silakan coba lagi.");
      }
      if (
        response.status === 409 ||
        result.code === "EMAIL_SUDAH_ADA"
      ) {
        setError(inputEmail, "Email sudah terdaftar.", true);
        return;
      }
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Pendaftaran gagal. Silakan coba lagi.");
      }

      window.location.assign("login.html");
    } catch (error) {
      console.error("Pendaftaran gagal:", error);
      setError(
        inputPassword,
        error instanceof TypeError
          ? "Tidak dapat menghubungi server. Pastikan API berjalan dan alamatnya benar."
          : error.message || "Pendaftaran gagal. Silakan coba lagi.",
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "DAFTAR";
    }
  });
});
