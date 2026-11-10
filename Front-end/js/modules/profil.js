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
<<<<<<< HEAD
  const nameDialog = document.querySelector("#profile-name-dialog");
  const nameCurrentBox = document.querySelector("#profile-name-current");
  const nameNextInput = document.querySelector("#profile-name-next");
  const btnChangeName = document.querySelector("#btn-ubah-nama");
  const btnCancelName = document.querySelector("#btn-cancel-name");
  const btnConfirmName = document.querySelector("#btn-confirm-name");
  const passwordDialog = document.querySelector("#profile-password-dialog");
  const passwordCurrentInput = document.querySelector("#profile-password-current");
  const passwordNextInput = document.querySelector("#profile-password-next");
  const btnChangePassword = document.querySelector("#btn-ubah-sandi");
  const btnCancelPassword = document.querySelector("#btn-cancel-password");
  const btnConfirmPassword = document.querySelector("#btn-confirm-password");
=======
  const btnGotoChangePass = document.querySelector("#btn-goto-changepass");

>>>>>>> ea9b487fa2ea25c7a6417f9b30ad494e243fc720
  const fullnameBox = document.querySelector("#profile-fullname");
  const emailBox = document.querySelector("#profile-email");

  const homeTitle = sectionLabel ? sectionLabel.textContent : "Cari Resep";
<<<<<<< HEAD

  function clearAuthState() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();

    for (const cookie of document.cookie.split(";")) {
      const cookieName = cookie.split("=")[0].trim();
      if (/(^|[_-])(token|jwt|auth|session)([_-]|$)/i.test(cookieName)) {
        document.cookie = `${cookieName}=; Max-Age=0; path=/; SameSite=Lax`;
      }
    }

    window.dispatchEvent(new Event("recipe:auth-cleared"));
  }

  function openDialog(dialog) {
    if (dialog instanceof HTMLDialogElement && !dialog.open) {
      dialog.showModal();
    }
  }

  async function requestApi(path, options) {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.status === "error") {
      throw new Error(result.message || "Permintaan tidak dapat diproses.");
    }
    return result;
  }
=======
>>>>>>> ea9b487fa2ea25c7a6417f9b30ad494e243fc720

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
      openDialog(guestModal);
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

>>>>>>> ea9b487fa2ea25c7a6417f9b30ad494e243fc720
      if (fullnameBox) {
        fullnameBox.textContent = user.nama || user.nama_lengkap || user.name || "Pengguna Racik Rasa";
      }
      if (emailBox) {
        emailBox.textContent = user.email || "-";
      }
    } catch (error) {
      console.error("Gagal mengambil profil:", error);
<<<<<<< HEAD
      clearAuthState();
      setProfileView(false);
      openDialog(guestModal);
    }
  }

=======
      localStorage.removeItem("token");
      setProfileView(false);
      if (guestModal instanceof HTMLDialogElement && !guestModal.open) {
        guestModal.showModal();
      }
    }
  }

  // API Handler untuk Ubah Nama
>>>>>>> ea9b487fa2ea25c7a6417f9b30ad494e243fc720
  async function handleUbahNama(namaBaru) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
<<<<<<< HEAD
      const result = await requestApi("/auth/profile", {
=======
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
>>>>>>> ea9b487fa2ea25c7a6417f9b30ad494e243fc720
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ nama: namaBaru }),
      });
<<<<<<< HEAD
      const updatedUser = result.data?.user || result.user || result.data;
      if (fullnameBox) {
        fullnameBox.textContent = updatedUser?.nama || namaBaru;
=======

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
>>>>>>> ea9b487fa2ea25c7a6417f9b30ad494e243fc720
      }
      if (nameDialog instanceof HTMLDialogElement) nameDialog.close();
    } catch (error) {
      console.error("Error ubah nama:", error);
      alert(error.message || "Gagal mengubah nama.");
    }
  }

  async function handleUbahPassword() {
    const token = localStorage.getItem("token");
    const passwordLama = passwordCurrentInput?.value;
    const passwordBaru = passwordNextInput?.value;
    if (!token || !passwordLama || !passwordBaru) {
      alert("Kata sandi lama dan baru wajib diisi.");
      return;
    }

    try {
      await requestApi("/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password_lama: passwordLama,
          password_baru: passwordBaru,
        }),
      });
      if (passwordDialog instanceof HTMLDialogElement) passwordDialog.close();
      passwordCurrentInput.value = "";
      passwordNextInput.value = "";
    } catch (error) {
      console.error("Error ubah kata sandi:", error);
      alert(error.message || "Gagal mengubah kata sandi.");
    }
  }

  function handleProfileNavigation(e) {
    if (e) e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      openDialog(guestModal);
      return;
    }

    setProfileView(true);
    void fetchUserData();
  }

<<<<<<< HEAD
=======
  const profileLinks = document.querySelectorAll('[data-nav-action="profile"]');
  profileLinks.forEach((link) => {
    link.addEventListener("click", handleProfileNavigation);
  });

>>>>>>> ea9b487fa2ea25c7a6417f9b30ad494e243fc720
  window.addEventListener("recipe:navigate-profile", () => {
    handleProfileNavigation();
  });

  window.addEventListener("recipe:navigate-home", () => {
    setProfileView(false);
    if (guestModal instanceof HTMLDialogElement && guestModal.open) guestModal.close();
    if (logoutModal instanceof HTMLDialogElement && logoutModal.open) logoutModal.close();
<<<<<<< HEAD
    if (nameDialog instanceof HTMLDialogElement && nameDialog.open) nameDialog.close();
    if (passwordDialog instanceof HTMLDialogElement && passwordDialog.open) passwordDialog.close();
=======
>>>>>>> ea9b487fa2ea25c7a6417f9b30ad494e243fc720
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

<<<<<<< HEAD
  if (btnChangeName) {
    btnChangeName.addEventListener("click", () => {
      if (!localStorage.getItem("token")) {
        openDialog(guestModal);
        return;
      }
      if (nameCurrentBox) nameCurrentBox.textContent = fullnameBox?.textContent || "";
      if (nameNextInput) nameNextInput.value = "";
      openDialog(nameDialog);
      nameNextInput?.focus();
=======
  if (btnGotoChangePass) {
    btnGotoChangePass.addEventListener("click", () => {
      window.location.assign("change-password.html");
>>>>>>> ea9b487fa2ea25c7a6417f9b30ad494e243fc720
    });
  }

  if (btnTriggerLogout) {
    btnTriggerLogout.addEventListener("click", () => openDialog(logoutModal));
  }

  if (btnCancelLogout) {
    btnCancelLogout.addEventListener("click", () => {
      if (logoutModal instanceof HTMLDialogElement) {
        logoutModal.close();
      }
    });
  }

<<<<<<< HEAD
  if (btnCancelName) {
    btnCancelName.addEventListener("click", () => {
      if (nameDialog instanceof HTMLDialogElement) nameDialog.close();
    });
  }

  if (btnConfirmName) {
    btnConfirmName.addEventListener("click", () => {
      const namaBaru = nameNextInput?.value.trim();
      if (!namaBaru) {
        alert("Nama tidak boleh kosong.");
        nameNextInput?.focus();
        return;
      }
      void handleUbahNama(namaBaru);
    });
  }

  if (btnChangePassword) {
    btnChangePassword.addEventListener("click", () => {
      if (!localStorage.getItem("token")) {
        openDialog(guestModal);
        return;
      }
      openDialog(passwordDialog);
      passwordCurrentInput?.focus();
    });
  }

  if (btnCancelPassword) {
    btnCancelPassword.addEventListener("click", () => {
      if (passwordDialog instanceof HTMLDialogElement) passwordDialog.close();
    });
  }

  if (btnConfirmPassword) {
    btnConfirmPassword.addEventListener("click", () => {
      void handleUbahPassword();
    });
  }

  document.querySelectorAll("[data-password-target]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = document.getElementById(toggle.dataset.passwordTarget);
      if (!(input instanceof HTMLInputElement)) return;
      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      toggle.setAttribute("aria-pressed", String(!isVisible));
      toggle.setAttribute(
        "aria-label",
        `${isVisible ? "Tampilkan" : "Sembunyikan"} kata sandi`,
      );
    });
  });

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

      clearAuthState();
      if (logoutModal instanceof HTMLDialogElement) {
        logoutModal.close();
      }
      setProfileView(false);
      window.dispatchEvent(new Event("recipe:navigate-home"));
      window.location.assign(window.location.pathname);
    });
  }
=======
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
>>>>>>> ea9b487fa2ea25c7a6417f9b30ad494e243fc720
}