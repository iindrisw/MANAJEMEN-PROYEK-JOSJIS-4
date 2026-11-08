const API_BASE_URL = "http://127.0.0.1:5000/api";

export function initProfile() {
  const appShell = document.querySelector(".app-shell");
  const searchPanel = document.querySelector(".search-panel");
  const recipeContent = document.querySelector(".recipe-content");
  const sectionLabel = document.querySelector(".section-label");

  const profileView = document.querySelector("#view-profile");
  const savedView = document.querySelector("#view-saved");
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

    if (savedView && isOpen) {
      savedView.hidden = true;
      if (appShell) appShell.classList.remove("is-saved-view");
    }

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

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
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

      const user = result.data?.user || result.user || result.data || result;

      if (fullnameBox) {
        fullnameBox.textContent = user.nama || user.nama_lengkap || user.name || "Pengguna Racik Rasa";
      }
      if (emailBox) {
        emailBox.textContent = user.email || "-";
      }
    } catch (error) {
      console.error("Gagal mengambil profil:", error);
      localStorage.removeItem("token");
      setProfileView(false);
      if (guestModal instanceof HTMLDialogElement && !guestModal.open) {
        guestModal.showModal();
      }
    }
  }

  // API Handler untuk Ubah Nama
  async function handleUbahNama(namaBaru) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ nama: namaBaru }),
      });

      const result = await response.json();

      if (!response.ok || result.status === "error") {
        alert(result.message || "Gagal mengubah nama.");
        return;
      }

      const updatedUser = result.data?.user || result.data;
      if (fullnameBox) {
        fullnameBox.textContent = updatedUser?.nama || namaBaru;
      }
      alert("Nama berhasil diperbarui!");
    } catch (error) {
      console.error("Error ubah nama:", error);
      alert("Terjadi kesalahan koneksi ke server.");
    }
  }

  // Klik pada Kotak Nama Lengkap untuk Ubah Nama
  if (fullnameBox) {
    // Memberikan indikasi bahwa kotak nama bisa diklik
    fullnameBox.style.cursor = "pointer";
    fullnameBox.title = "Klik untuk mengubah nama";

    fullnameBox.parentElement?.addEventListener("click", () => {
      const namaLama = fullnameBox.textContent !== "Memuat..." ? fullnameBox.textContent : "";
      const namaBaru = prompt("Edit Nama Lengkap:", namaLama);
      
      if (namaBaru !== null && namaBaru.trim() !== "" && namaBaru.trim() !== namaLama) {
        void handleUbahNama(namaBaru.trim());
      }
    });
  }

  // Event Navigasi
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
  profileLinks.forEach((link) => {
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

  // Modal Handlers
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

  if (btnGotoChangePass) {
    btnGotoChangePass.addEventListener("click", () => {
      window.location.assign("change-password.html");
    });
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
      if (logoutModal instanceof HTMLDialogElement) {
        logoutModal.close();
      }
    });
  }

  if (btnConfirmLogout) {
    btnConfirmLogout.addEventListener("click", async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          });
        } catch (err) {
          console.warn("Gagal request logout ke BE:", err);
        }
      }

      localStorage.removeItem("token");
      if (logoutModal instanceof HTMLDialogElement) {
        logoutModal.close();
      }
      setProfileView(false);
      window.location.assign("login.html");
    });
  }
}