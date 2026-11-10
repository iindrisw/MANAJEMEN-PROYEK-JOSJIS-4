const API_BASE_URL = "http://127.0.0.1:5000/api";
// Ganti dengan Client ID yang kamu dapat dari Google Cloud Console
const GOOGLE_CLIENT_ID = "105928934373-ai6hsqd7o7h985it0v6ngja0f62qs1aa.apps.googleusercontent.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#loginForm");
  const inputIdentifier = document.querySelector("#loginNama");
  const inputPassword = document.querySelector("#loginSandi");
  const submitButton = document.querySelector("#btnMasuk");
  const forgotLink = document.querySelector("#forgotPasswordLink");
  const googleBtnContainer = document.querySelector("#btnGoogleLogin"); // Container tombol Google

  if (
    !(form instanceof HTMLFormElement) ||
    !(inputIdentifier instanceof HTMLInputElement) ||
    !(inputPassword instanceof HTMLInputElement) ||
    !(submitButton instanceof HTMLButtonElement)
  ) {
    throw new Error("Elemen formulir login tidak ditemukan.");
  }

  function setError(input, message) {
    const group = input.closest(".form-group");
    const errorMessage = group?.querySelector(".error-message");
    group?.classList.add("error");
    if (errorMessage) errorMessage.textContent = message;
  }

  function clearError(input) {
    const group = input.closest(".form-group");
    const errorMessage = group?.querySelector(".error-message");
    group?.classList.remove("error");
    if (errorMessage) errorMessage.textContent = "";
  }

  for (const input of [inputIdentifier, inputPassword]) {
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

  forgotLink?.addEventListener("click", (event) => {
    event.preventDefault();
    window.alert("Fitur lupa kata sandi belum tersedia.");
  });

  // Login Form Biasa (Nama/Email + Password)
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const identifier = inputIdentifier.value.trim();
    const password = inputPassword.value;
    let isValid = true;

    if (!identifier) {
      setError(inputIdentifier, "Nama atau email wajib diisi.");
      isValid = false;
    }
    if (!password) {
      setError(inputPassword, "Kata sandi wajib diisi.");
      isValid = false;
    }
    if (!isValid) return;

    submitButton.disabled = true;
    submitButton.textContent = "MEMPROSES...";

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: identifier, password }),
      });
      const result = await response.json().catch(() => null);

      if (!result || typeof result !== "object") {
        throw new Error("Respons server tidak valid. Silakan coba lagi.");
      }
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Nama/email atau kata sandi salah.");
      }

      // Dukung format token langsung (result.token) atau terbungkus (result.data.token)
      const token = result.data?.token || result.token;
      const user = result.data?.user || result.user;

      if (typeof token !== "string" || !token) {
        throw new Error("Login berhasil tetapi token tidak diterima dari server.");
      }

      localStorage.setItem("token", token);
      if (user && typeof user === "object") {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
      window.location.assign("index.html");
    } catch (error) {
      console.error("Login gagal:", error);
      setError(
        inputPassword,
        error instanceof TypeError
          ? "Tidak dapat menghubungi server. Pastikan API berjalan dan alamatnya benar."
          : error.message || "Login gagal. Silakan coba lagi.",
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "MASUK";
    }
  });

  // Callback setelah Pengguna Berhasil Login via Popup Google
  async function handleGoogleCredentialResponse(googleResponse) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: googleResponse.credential }),
      });

      const result = await response.json().catch(() => null);

      if (!result || typeof result !== "object") {
        throw new Error("Respons server tidak valid.");
      }
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Gagal autentikasi via Google.");
      }

      const token = result.data?.token || result.token;
      const user = result.data?.user || result.user;

      if (!token) {
        throw new Error("Token autentikasi tidak ditemukan.");
      }

      localStorage.setItem("token", token);
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      window.location.assign("index.html");
    } catch (error) {
      console.error("Login Google gagal:", error);
      alert(error.message || "Gagal masuk menggunakan akun Google.");
    }
  }

  // Inisialisasi Google Identity Services SDK
  if (window.google?.accounts?.id) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredentialResponse,
    });

    if (googleBtnContainer) {
      google.accounts.id.renderButton(googleBtnContainer, {
        theme: "outline",
        size: "large",
        width: "100%",
        text: "signin_with",
      });
    }
  }
});