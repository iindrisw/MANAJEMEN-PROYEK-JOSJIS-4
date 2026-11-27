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

const GOOGLE_CLIENT_ID =
  "105928934373-ai6hsqd7o7h985it0v6ngja0f62qs1aa.apps.googleusercontent.com";

const GMAIL_REGEX = /^[a-z0-9._%+-]+@gmail\.com$/;

function renderCustomGoogleButton(container, onTriggerPrompt) {
  container.replaceChildren();

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn-google-custom";
  button.setAttribute("aria-label", "Masuk dengan Google");
  button.style.cssText = [
    "display: inline-flex",
    "align-items: center",
    "justify-content: center",
    "gap: 10px",
    "width: 100%",
    "min-height: 44px",
    "padding: 10px 16px",
    "background: #ffffff",
    "color: #1f1f1f",
    "border: 1px solid #dadce0",
    "border-radius: 6px",
    "font-size: 14px",
    "font-weight: 500",
    "cursor: pointer",
  ].join(";");

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("width", "18");
  icon.setAttribute("height", "18");
  icon.setAttribute("viewBox", "0 0 48 48");
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = `
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  `;

  const label = document.createElement("span");
  label.textContent = "Masuk dengan Google";

  button.append(icon, label);
  button.addEventListener("click", onTriggerPrompt);
  container.append(button);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#loginForm");
  const inputIdentifier = document.querySelector("#loginNama");
  const inputPassword = document.querySelector("#loginSandi");
  const submitButton = document.querySelector("#btnMasuk");
  const googleBtnContainer = document.querySelector("#btnGoogleLogin");

  // Type guard checking untuk mencegah error jika elemen DOM tidak ditemukan
  if (
    !(form instanceof HTMLFormElement) ||
    !(inputIdentifier instanceof HTMLInputElement) ||
    !(inputPassword instanceof HTMLInputElement) ||
    !(submitButton instanceof HTMLButtonElement)
  ) {
    console.warn("Beberapa elemen formulir login tidak ditemukan di halaman ini.");
    return;
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

  blockUnsupportedCharacters(inputIdentifier, {
    message: EMAIL_ERROR_MESSAGE,
    setError: (message) => setError(inputIdentifier, message),
    clearError: () => clearError(inputIdentifier),
    isEmailIdentifier: true,
    requireEmailMarker: true,
  });
  blockUnsupportedCharacters(inputPassword, {
    message: PASSWORD_ERROR_MESSAGE,
    setError: (message) => setError(inputPassword, message),
    clearError: () => clearError(inputPassword),
  });

  // Toggle Password Visibility (Ikon Mata)
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

  // Login Form Manual (Nama/Email + Password)
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const identifier = inputIdentifier.value.trim();
    const password = inputPassword.value;
    let isValid = true;

    if (!identifier) {
      setError(inputIdentifier, "Kolom ini wajib diisi");
      isValid = false;
    } else if (identifier.includes("@")) {
      const normalizedIdentifier = identifier.toLowerCase();
      if (containsUnsupportedEmailCharacter(identifier)) {
        setError(inputIdentifier, EMAIL_ERROR_MESSAGE);
        isValid = false;
      } else if (!GMAIL_REGEX.test(normalizedIdentifier)) {
        setError(inputIdentifier, "Email harus menggunakan domain @gmail.com");
        isValid = false;
      }
    }
    if (!password) {
      setError(inputPassword, "Kolom ini wajib diisi");
      isValid = false;
    } else if (containsUnsupportedCharacter(password)) {
      setError(inputPassword, PASSWORD_ERROR_MESSAGE);
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
        throw new Error(result.message || "Email atau kata sandi salah, silakan periksa kembali.");
      }

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
        isNetworkConnectionError(error)
          ? NETWORK_CONNECTION_ERROR_MESSAGE
          : error.message || "Login gagal. Silakan coba lagi."
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "MASUK";
    }
  });

  // Inisialisasi tombol kustom "Masuk dengan Google" + Google Identity Services SDK
  if (googleBtnContainer instanceof HTMLElement) {
    let isGoogleInitialized = false;

    const ensureGoogleInit = () => {
      if (!window.google?.accounts?.id) {
        return false;
      }
      if (!isGoogleInitialized) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
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
            text: "signin_with",
          });
        }
      });
    };

    renderCustomGoogleButton(googleBtnContainer, handleGoogleClick);

    if (window.google?.accounts?.id) {
      ensureGoogleInit();
    } else {
      window.addEventListener("load", ensureGoogleInit, { once: true });
    }
  }
});

// Callback setelah Pengguna Berhasil Login via Popup/Prompt Google
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
    const notification = document.querySelector("#google-auth-error");
    if (!(notification instanceof HTMLElement)) {
      console.error("Notifikasi gagal Google tidak ditemukan.");
      return;
    }

    notification.textContent = isNetworkConnectionError(error)
      ? NETWORK_CONNECTION_ERROR_MESSAGE
      : error.message || "Gagal autentikasi via Google.";
    notification.hidden = false;
  }
}
