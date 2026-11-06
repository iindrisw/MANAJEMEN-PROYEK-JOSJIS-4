const API_BASE_URL = "http://127.0.0.1:5000/api";

export function initProfile() {
  const appShell = document.querySelector(".app-shell");
  const searchPanel = document.querySelector(".search-panel");
  const recipeContent = document.querySelector(".recipe-content");
  const sectionLabel = document.querySelector(".section-label");
  const profileView = document.querySelector("#view-profile");
  const savedView = document.querySelector("#view-saved");
  const detailView = document.querySelector("#recipe-detail");
  const stepsView = document.querySelector("#recipe-steps-screen");
  const cookingModeView = document.querySelector("#cooking-mode-screen");

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
  const homeTitle = sectionLabel?.textContent || "Cari Resep";

  function setProfileView(isOpen) {
    appShell?.classList.toggle("is-profile-view", isOpen);
    if (profileView) profileView.hidden = !isOpen;
    if (searchPanel) searchPanel.hidden = false;
    if (recipeContent) recipeContent.hidden = isOpen;
    if (savedView) savedView.hidden = true;
    if (detailView) detailView.hidden = isOpen;
    if (stepsView) stepsView.hidden = isOpen;
    if (cookingModeView) cookingModeView.hidden = isOpen;
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

    if (fullnameBox) fullnameBox.textContent = "Memuat...";
    if (emailBox) emailBox.textContent = "Memuat...";

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || result?.status !== "success") {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setProfileView(false);
          if (guestModal instanceof HTMLDialogElement && !guestModal.open) {
            guestModal.showModal();
          }
          return;
        }
        throw new Error(result?.message || "Profil tidak dapat dimuat.");
      }

      const user = result.user;
      if (!user || typeof user !== "object") {
        throw new Error("Data profil dari server tidak valid.");
      }
      if (fullnameBox) {
        fullnameBox.textContent = user.nama || user.name || "Pengguna Racik Rasa";
      }
      if (emailBox) emailBox.textContent = user.email || "-";
    } catch (error) {
      console.error("Gagal mengambil profil:", error);
      if (fullnameBox) fullnameBox.textContent = "Profil tidak dapat dimuat.";
      if (emailBox) {
        emailBox.textContent = error instanceof TypeError
          ? "Periksa koneksi ke server lalu coba lagi."
          : error.message || "Silakan coba lagi.";
      }
    }
  }

  window.addEventListener("recipe:navigate-profile", () => {
    if (!localStorage.getItem("token")) {
      if (guestModal instanceof HTMLDialogElement && !guestModal.open) {
        guestModal.showModal();
      }
      return;
    }

    setProfileView(true);
    void fetchUserData();
  });

  window.addEventListener("recipe:navigate-home", () => {
    setProfileView(false);
    if (guestModal instanceof HTMLDialogElement && guestModal.open) {
      guestModal.close();
    }
    if (logoutModal instanceof HTMLDialogElement && logoutModal.open) {
      logoutModal.close();
    }
  });

  if (btnModalLogin) {
    btnModalLogin.addEventListener("click", () => {
      if (guestModal instanceof HTMLDialogElement) guestModal.close();
      window.location.assign("login.html");
    });
  }

  if (closeGuestModalBtn) {
    closeGuestModalBtn.addEventListener("click", () => {
      if (guestModal instanceof HTMLDialogElement) guestModal.close();
    });
  }

  if (btnGotoChangePass instanceof HTMLButtonElement) {
    btnGotoChangePass.disabled = true;
    btnGotoChangePass.title = "Fitur ubah kata sandi belum tersedia.";
  }

  if (btnTriggerLogout) {
    btnTriggerLogout.addEventListener("click", () => {
      if (logoutModal instanceof HTMLDialogElement && !logoutModal.open) {
        logoutModal.showModal();
      }
    });
  }

  if (btnCancelLogout) {
    btnCancelLogout.addEventListener("click", () => {
      if (logoutModal instanceof HTMLDialogElement) logoutModal.close();
    });
  }

  if (btnConfirmLogout) {
    btnConfirmLogout.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (logoutModal instanceof HTMLDialogElement) logoutModal.close();
      setProfileView(false);
      window.location.assign("login.html");
    });
  }
}
