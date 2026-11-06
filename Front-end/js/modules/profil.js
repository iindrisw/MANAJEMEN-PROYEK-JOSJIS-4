const API_BASE_URL = "http://127.0.0.1:5000/api";

export function initProfile() {
  const appShell = document.querySelector(".app-shell");
  const searchPanel = document.querySelector(".search-panel");
  const recipeContent = document.querySelector(".recipe-content");
  const sectionLabel = document.querySelector(".section-label");

  const profileView = document.querySelector("#view-profile");
  const guestModal = document.querySelector("#guest-modal");
  const closeGuestModalBtn = document.querySelector("#close-guest-modal");
  const btnModalLogin = document.querySelector("#btn-modal-login");

  const logoutModal = document.querySelector("#logout-confirm-modal");
  const btnTriggerLogout = document.querySelector("#btn-trigger-logout");
  const btnCancelLogout = document.querySelector("#btn-cancel-logout");
  const btnConfirmLogout = document.querySelector("#btn-confirm-logout");
  const btnGotoChangePass = document.querySelector("#btn-goto-changepass");

  const fullnameBox = document.querySelector("#profile-fullname");
  const emailBox = document.querySelector("#profile-email");

  const homeTitle = sectionLabel ? sectionLabel.textContent : "Cari Resep";

  function setProfileView(isOpen) {
    if (appShell) appShell.classList.toggle("is-profile-view", isOpen);
    if (profileView) profileView.hidden = !isOpen;
    if (searchPanel) searchPanel.hidden = isOpen;
    if (recipeContent) recipeContent.hidden = isOpen;
    if (sectionLabel) sectionLabel.textContent = isOpen ? "PROFIL" : homeTitle;
  }

  async function fetchUserData() {
    const token = localStorage.getItem("token");
    if (!token) {
      setProfileView(false);
      if (guestModal instanceof HTMLDialogElement && !guestModal.open) {
        guestModal.showModal();
      }
      return;
    }

    try {
      if (fullnameBox) fullnameBox.textContent = "Memuat...";
      if (emailBox) emailBox.textContent = "Memuat...";

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (!response.ok || result.status === "error") {
        localStorage.removeItem("token");
        setProfileView(false);
        if (guestModal instanceof HTMLDialogElement && !guestModal.open) {
          guestModal.showModal();
        }
        return;
      }

      const user = result.data || result;
      if (fullnameBox) fullnameBox.textContent = user.nama_lengkap || user.name || "Pengguna Racik Rasa";
      if (emailBox) emailBox.textContent = user.email || "-";
    } catch (error) {
      console.error("Gagal mengambil profil:", error);
      localStorage.removeItem("token");
      setProfileView(false);
      if (guestModal instanceof HTMLDialogElement && !guestModal.open) {
        guestModal.showModal();
      }
    }
  }

  // Event navigasi ke menu profil
  function handleProfileNavigation(e) {
    if (e) e.preventDefault();
    const token = localStorage.getItem("token");
    
    if (!token) {
      if (guestModal instanceof HTMLDialogElement && !guestModal.open) {
        guestModal.showModal();
      }
      return;
    }

    setProfileView(true);
    void fetchUserData();
  }

  const profileLinks = document.querySelectorAll('[data-nav-action="profile"]');
  profileLinks.forEach(link => {
    link.addEventListener("click", handleProfileNavigation);
  });

  window.addEventListener("recipe:navigate-profile", () => {
    handleProfileNavigation();
  });

  window.addEventListener("recipe:navigate-home", () => {
    setProfileView(false);
    if (guestModal instanceof HTMLDialogElement && guestModal.open) guestModal.close();
    if (logoutModal instanceof HTMLDialogElement && logoutModal.open) logoutModal.close();
  });

  // Tombol Login pada guest modal
  if (btnModalLogin) {
    btnModalLogin.addEventListener("click", () => {
      if (guestModal instanceof HTMLDialogElement) guestModal.close();
      window.location.assign("login.html");
    });
  }

  // Tombol tutup (X) guest modal
  if (closeGuestModalBtn) {
    closeGuestModalBtn.addEventListener("click", () => {
      if (guestModal instanceof HTMLDialogElement) guestModal.close();
    });
  }

  // Tombol ubah kata sandi
  if (btnGotoChangePass) {
    btnGotoChangePass.addEventListener("click", () => {
      window.location.assign("change-password.html");
    });
  }

  // Memicu munculnya modal logout
  if (btnTriggerLogout) {
    btnTriggerLogout.addEventListener("click", () => {
      if (logoutModal instanceof HTMLDialogElement && !logoutModal.open) {
        logoutModal.showModal();
      }
    });
  }

  // Tombol Batal pada modal logout
  if (btnCancelLogout) {
    btnCancelLogout.addEventListener("click", () => {
      if (logoutModal instanceof HTMLDialogElement) {
        logoutModal.close();
      }
    });
  }

  // Tombol Konfirmasi Keluar (Logout) pada modal logout
  if (btnConfirmLogout) {
    btnConfirmLogout.addEventListener("click", () => {
      localStorage.removeItem("token");
      if (logoutModal instanceof HTMLDialogElement) {
        logoutModal.close();
      }
      setProfileView(false);
      window.location.assign("login.html");
    });
  }
}