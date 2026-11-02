const API_BASE_URL = "http://127.0.0.1:5000/api";

export function initLogin() {
  const appShell = document.querySelector(".app-shell");
  const loginScreen = document.querySelector("#login-screen");
  const loginBrand = document.querySelector(".login-brand");
  const loginForm = document.querySelector("#login-form");
  const nameInput = document.querySelector("#login-name");
  const passwordInput = document.querySelector("#login-password");
  const submitButton = document.querySelector("#login-submit");
  const feedback = document.querySelector("#login-feedback");
  const forgotLink = document.querySelector("#login-forgot-link");
  const signupLink = document.querySelector("#login-signup-link");

  if (
    !(appShell instanceof HTMLElement) ||
    !(loginScreen instanceof HTMLElement) ||
    !(loginBrand instanceof HTMLAnchorElement) ||
    !(loginForm instanceof HTMLFormElement) ||
    !(nameInput instanceof HTMLInputElement) ||
    !(passwordInput instanceof HTMLInputElement) ||
    !(submitButton instanceof HTMLButtonElement) ||
    !(feedback instanceof HTMLElement) ||
    !(forgotLink instanceof HTMLAnchorElement) ||
    !(signupLink instanceof HTMLAnchorElement)
  ) {
    throw new Error("Elemen halaman masuk tidak ditemukan.");
  }

  function setLoginView(isOpen) {
    loginScreen.hidden = !isOpen;
    appShell.classList.toggle("is-login-view", isOpen);
    if (isOpen) {
      nameInput.focus();
    }
  }

  function showFeedback(message, isSuccess = false) {
    feedback.textContent = message;
    feedback.classList.toggle("is-success", isSuccess);
    feedback.hidden = !message;
  }

  window.addEventListener("recipe:navigate-login", () => {
    loginForm.reset();
    showFeedback("");
    setLoginView(true);
  });

  window.addEventListener("recipe:navigate-home", () => {
    setLoginView(false);
  });

  loginBrand.addEventListener("click", (event) => {
    event.preventDefault();
    window.dispatchEvent(new Event("recipe:navigate-home"));
  });

  for (const link of [forgotLink, signupLink]) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showFeedback(
        link === forgotLink
          ? "Fitur lupa kata sandi belum tersedia."
          : "Fitur pendaftaran belum tersedia.",
      );
    });
  }

  for (const input of [nameInput, passwordInput]) {
    input.addEventListener("input", () => showFeedback(""));
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nama = nameInput.value.trim();
    const password = passwordInput.value;

    if (!nama || !password) {
      showFeedback("Nama dan kata sandi wajib diisi.");
      (nama ? passwordInput : nameInput).focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "MEMPROSES...";
    showFeedback("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, password }),
      });
      const result = await response.json();

      if (!response.ok || result.status === "error") {
        throw new Error(result.message || "Nama atau kata sandi salah.");
      }
      if (typeof result.token !== "string" || !result.token || !result.user) {
        throw new Error("Respons login dari server tidak valid.");
      }

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      showFeedback(`Berhasil masuk, ${result.user.nama || nama}.`, true);
      window.setTimeout(() => {
        window.dispatchEvent(new Event("recipe:login-success"));
      }, 700);
    } catch (error) {
      showFeedback(
        error instanceof TypeError
          ? "Server tidak dapat dijangkau. Periksa koneksi lalu coba lagi."
          : error.message,
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "MASUK";
    }
  });
}
