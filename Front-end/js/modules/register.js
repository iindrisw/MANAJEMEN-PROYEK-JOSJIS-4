import { API_BASE_URL } from "./api.js";
import {
  blockUnsupportedCharacters,
  containsUnsupportedCharacter,
  containsUnsupportedEmailCharacter,
  EMAIL_ERROR_MESSAGE,
  PASSWORD_ERROR_MESSAGE,
} from "./input.js";

const GOOGLE_CLIENT_ID =
  "105928934373-ai6hsqd7o7h985it0v6ngja0f62qs1aa.apps.googleusercontent.com";

const NETWORK_CONNECTION_ERROR_MESSAGE =
  "Tidak dapat menghubungi server. Periksa koneksi internet Anda lalu coba lagi.";

function isNetworkConnectionError(error) {
  if (error instanceof TypeError) {
    return true;
  }
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("load failed") ||
    message.includes("connection")
  );
}

function renderCustomGoogleRegisterButton(container, onTriggerPrompt) {
  container.replaceChildren();

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn-google-custom";
  button.setAttribute("aria-label", "Daftar dengan Google");
  button.style.cssText = [
    "display: inline-flex",
    "align-items: center",
    "justify-content: center",
    "gap: 10px",
    "width: 224px",
    "max-width: 100%",
    "height: 40px",
    "padding: 0 16px",
    "background: #FFEEB5",
    "color: #1f1f1f",
    "border: 1px solid rgb(37 37 37 / 2%)",
    "border-radius: 10px",
    "font-size: 14px",
    "font-weight: 500",
    "cursor: pointer",
  ].join(";");

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("width", "24");
  icon.setAttribute("height", "24");
  icon.setAttribute("viewBox", "0 0 48 48");
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = `
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  `;

  const label = document.createElement("span");
  label.textContent = "Daftar dengan Google";

  button.append(icon, label);
  button.addEventListener("click", onTriggerPrompt);
  container.append(button);
}

async function handleGoogleRegisterCredential(googleResponse) {
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
      throw new Error(result.message || "Gagal mendaftar via Google.");
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
    console.error("Daftar dengan Google gagal:", error);
    const notification = document.querySelector("#google-auth-error");
    if (!(notification instanceof HTMLElement)) {
      console.error("Notifikasi gagal Google tidak ditemukan.");
      return;
    }

    notification.textContent = isNetworkConnectionError(error)
      ? NETWORK_CONNECTION_ERROR_MESSAGE
      : error.message || "Gagal mendaftar via Google.";
    notification.hidden = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#registerForm");
  const inputName = document.querySelector("#registerNama");
  const inputEmail = document.querySelector("#registerEmail");
  const inputPassword = document.querySelector("#registerSandi");
  const inputConfirmation = document.querySelector("#registerKonfirmasi");
  const submitButton = document.querySelector("#btnDaftar");
  const googleBtnContainer = document.querySelector("#btnGoogleRegister");

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
      errorMessage.classList.toggle("is-long", message.length > 64);
    }
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

  blockUnsupportedCharacters(inputEmail, {
    message: EMAIL_ERROR_MESSAGE,
    setError: (message) => setError(inputEmail, message),
    clearError: () => clearError(inputEmail),
    isEmailIdentifier: true,
  });
  blockUnsupportedCharacters(inputPassword, {
    message: PASSWORD_ERROR_MESSAGE,
    setError: (message) => setError(inputPassword, message),
    clearError: () => clearError(inputPassword),
  });
  blockUnsupportedCharacters(inputConfirmation, {
    message: PASSWORD_ERROR_MESSAGE,
    setError: (message) => setError(inputConfirmation, message),
    clearError: () => clearError(inputConfirmation),
  });

  for (const input of [inputName]) {
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

    submitButton.disabled = true;
    submitButton.textContent = "MEMPROSES...";

    const nama = inputName.value.trim();
    const enteredEmail = inputEmail.value.trim();
    const email = enteredEmail.toLowerCase();
    const password = inputPassword.value;
    const confirmation = inputConfirmation.value;
    let isValid = true;

    clearError(inputName);
    clearError(inputEmail);
    clearError(inputPassword);
    clearError(inputConfirmation);

    // 1. Validasi Nama
    if (!nama) {
      setError(inputName, "Kolom ini wajib diisi");
      isValid = false;
    } else if (nama.length > 64) {
      setError(inputName, "Nama Lengkap maksimal 64 karakter");
      isValid = false;
    }

    // 2. Validasi Email (Format lokal)
    if (!email) {
      setError(inputEmail, "Kolom ini wajib diisi");
      isValid = false;
    } else if (containsUnsupportedEmailCharacter(enteredEmail)) {
      setError(inputEmail, EMAIL_ERROR_MESSAGE);
      isValid = false;
    } else if (
      email.length > 100 ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    ) {
      setError(inputEmail, EMAIL_ERROR_MESSAGE);
      isValid = false;
    }

    // 3. Validasi Kata Sandi
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,64}$/;
    if (!password) {
      setError(inputPassword, "Kolom ini wajib diisi");
      isValid = false;
    } else if (containsUnsupportedCharacter(password)) {
      setError(inputPassword, PASSWORD_ERROR_MESSAGE);
      isValid = false;
    } else if (/\s/.test(password)) {
      setError(inputPassword, PASSWORD_ERROR_MESSAGE);
      isValid = false;
    } else if (!passwordRegex.test(password)) {
      setError(inputPassword, PASSWORD_ERROR_MESSAGE);
      isValid = false;
    }

    // 4. Validasi Konfirmasi Kata Sandi
    if (!confirmation) {
      setError(inputConfirmation, "Kolom ini wajib diisi");
      isValid = false;
    } else if (containsUnsupportedCharacter(confirmation)) {
      setError(inputConfirmation, PASSWORD_ERROR_MESSAGE);
      isValid = false;
    } else if (password !== confirmation) {
      setError(inputConfirmation, "Kata sandi tidak sama, silakan periksa kembali");
      isValid = false;
    }

    if (!isValid) {
      submitButton.disabled = false;
      submitButton.textContent = "DAFTAR";
      return;
    }

    // 5. Kirim data ke Server (Registrasi & Cek Duplikat Email)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, email, password }),
      });
      const result = await response.json().catch(() => null);

      if (result && (response.status === 409 || result.code === "EMAIL_SUDAH_ADA")) {
        setError(inputEmail, "Email sudah terdaftar, silakan beralih ke login");
        isValid = false;
      } else if (!response.ok || (result && result.status !== "success")) {
        throw new Error(result?.message || "Gagal melakukan pendaftaran ke server.");
      }
    } catch (error) {
      console.error("Gagal menghubungi server:", error);
      const message = isNetworkConnectionError(error)
        ? NETWORK_CONNECTION_ERROR_MESSAGE
        : error?.message || "Gagal melakukan pendaftaran ke server.";
      setError(inputConfirmation, message);
      isValid = false;
    }

    if (!isValid) {
      submitButton.disabled = false;
      submitButton.textContent = "DAFTAR";
      return;
    }

    window.location.assign("login.html");
  });

  // Inisialisasi tombol kustom "Daftar dengan Google" + Google Identity Services SDK
  if (googleBtnContainer instanceof HTMLElement) {
    let isGoogleInitialized = false;

    const ensureGoogleInit = () => {
      if (!window.google?.accounts?.id) {
        return false;
      }
      if (!isGoogleInitialized) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleRegisterCredential,
        });
        isGoogleInitialized = true;
      }
      return true;
    };

    const handleGoogleClick = () => {
      if (!ensureGoogleInit()) {
        const notification = document.querySelector("#google-auth-error");
        if (notification instanceof HTMLElement) {
          notification.textContent =
            "Layanan Google belum siap. Silakan coba beberapa saat lagi.";
          notification.hidden = false;
        }
        return;
      }

      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const fallbackContainer = document.createElement("div");
          googleBtnContainer.replaceChildren(fallbackContainer);
          google.accounts.id.renderButton(fallbackContainer, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "signup_with",
          });
        }
      });
    };

    renderCustomGoogleRegisterButton(googleBtnContainer, handleGoogleClick);

    if (window.google?.accounts?.id) {
      ensureGoogleInit();
    } else {
      window.addEventListener("load", ensureGoogleInit, { once: true });
    }
  }
});