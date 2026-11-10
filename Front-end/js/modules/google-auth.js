const API_BASE_URL = "http://127.0.0.1:5000/api";
const GOOGLE_CLIENT_ID = "ISI_CLIENT_ID_KAMU.apps.googleusercontent.com";
const PESAN_GAGAL = "Gagal terhubung dengan Google, silakan coba beberapa saat lagi";

export function initGoogleAuth() {
  const button = document.querySelector(".btn-google-login");
  if (!button) return;

  // Bungkus tombol kustom + overlay tombol resmi Google (transparan, di atasnya)
  const wrapper = document.createElement("div");
  wrapper.className = "google-wrapper";
  button.replaceWith(wrapper);
  const overlay = document.createElement("div");
  overlay.className = "google-overlay";
  wrapper.append(button, overlay);

  const message = document.createElement("p");
  message.className = "google-error";
  message.hidden = true;
  wrapper.after(message);

  const showError = () => {
    message.textContent = PESAN_GAGAL;
    message.hidden = false;
  };
  const clearError = () => { message.hidden = true; };

  async function handleCredential({ credential }) {
    clearError();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: credential }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.token) {
        throw new Error(result.message || "Login Google ditolak server.");
      }
      localStorage.setItem("token", result.token);
      if (result.user) localStorage.setItem("user", JSON.stringify(result.user));
      window.location.href = "index.html";
    } catch (error) {
      console.error("Login Google gagal:", error);
      showError();
    }
  }

  // Muat Google Identity Services
  let loaded = false;
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.onload = () => {
    loaded = true;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
    });
    window.google.accounts.id.renderButton(overlay, {
      type: "icon", size: "large", shape: "rectangular",
    });
  };
  script.onerror = showError;
  document.head.append(script);

  // Kalau script Google belum/gagal termuat, klik tombol tetap memberi pesan
  button.addEventListener("click", () => { if (!loaded) showError(); });
}