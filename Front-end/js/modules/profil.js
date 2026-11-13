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
  const nameDialog = document.querySelector("#profile-name-dialog");
  const nameEditCard = document.querySelector(".profile-name-edit-card");
  const nameSuccessDialog = document.querySelector(
    "#profile-name-success-dialog",
  );
  const btnNameSuccessClose = document.querySelector(
    "#profile-name-success-close",
  );
  const nameNextInput = document.querySelector("#profile-name-next");
  const nameError = document.querySelector("#profile-name-error");
  const btnChangeName = document.querySelector("#btn-ubah-nama");
  const btnCancelName = document.querySelector("#btn-cancel-name");
  const btnConfirmName = document.querySelector("#btn-confirm-name");
  const fullnameBox = document.querySelector("#profile-fullname");
  const emailBox = document.querySelector("#profile-email");
  const nameStatus = document.querySelector("#profile-name-status");
  const homeTitle = sectionLabel ? sectionLabel.textContent : "Cari Resep";

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
      const error = new Error(result.message || "Permintaan tidak dapat diproses.");
      error.status = response.status;
      throw error;
    }
    return result;
  }

  function setProfileView(isOpen) {
    if (appShell) appShell.classList.toggle("is-profile-view", isOpen);
    if (profileView) profileView.hidden = !isOpen;
    if (searchPanel) searchPanel.hidden = false;
    if (recipeContent) recipeContent.hidden = isOpen;

    if (savedView && isOpen) {
      savedView.hidden = true;
      if (appShell) appShell.classList.remove("is-saved-view");
    }

    if (sectionLabel) sectionLabel.textContent = isOpen ? "PROFIL" : homeTitle;
  }

  function showNameStatus(message, isError = false) {
    if (!(nameStatus instanceof HTMLElement)) return;
    nameStatus.textContent = message;
    nameStatus.classList.toggle("is-error", isError);
    nameStatus.hidden = !message;
  }

  function clearNameError() {
    if (nameEditCard instanceof HTMLElement) {
      nameEditCard.classList.remove("has-error");
    }
    if (nameNextInput instanceof HTMLInputElement) {
      nameNextInput.classList.remove("is-invalid");
      nameNextInput.removeAttribute("aria-invalid");
    }
    if (nameError instanceof HTMLElement) {
      nameError.textContent = "";
      nameError.hidden = true;
    }
  }

  function setNameError(message) {
    if (nameEditCard instanceof HTMLElement) {
      nameEditCard.classList.add("has-error");
    }
    if (nameNextInput instanceof HTMLInputElement) {
      nameNextInput.classList.add("is-invalid");
      nameNextInput.setAttribute("aria-invalid", "true");
    }
    if (nameError instanceof HTMLElement) {
      nameError.textContent = message;
      nameError.hidden = false;
    }
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

      const result = await requestApi("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = result.data?.user || result.user || result.data || result;

      if (fullnameBox) {
        fullnameBox.textContent =
          user.nama || user.nama_lengkap || user.name || "Pengguna Racik Rasa";
      }
      if (emailBox) emailBox.textContent = user.email || "-";
    } catch (error) {
      console.error("Gagal mengambil profil:", error);
      if (error.status === 401 || error.status === 403) {
        clearAuthState();
        setProfileView(false);
        openDialog(guestModal);
        return;
      }
      showNameStatus(error.message || "Gagal memuat data profil.", true);
    }
  }

  async function saveName() {
    const token = localStorage.getItem("token");
    const namaBaru = nameNextInput?.value ?? "";

    clearNameError();
    if (namaBaru.length === 0) {
      setNameError("Kolom ini wajib diisi");
      nameNextInput?.focus();
      return;
    }
    if (namaBaru.length > 64) {
      setNameError("Nama lengkap maksimal 64 karakter");
      nameNextInput?.focus();
      return;
    }
    if (!token) {
      if (nameDialog instanceof HTMLDialogElement) nameDialog.close();
      openDialog(guestModal);
      return;
    }

    btnConfirmName.disabled = true;
    btnConfirmName.textContent = "Menyimpan...";
    try {
      const result = await requestApi("/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nama: namaBaru }),
      });
      const updatedUser = result.data?.user || result.user || result.data;
      if (fullnameBox) fullnameBox.textContent = updatedUser?.nama || namaBaru;
      if (nameDialog instanceof HTMLDialogElement) nameDialog.close();
      showNameStatus("");
      openDialog(nameSuccessDialog);
    } catch (error) {
      console.error("Gagal mengubah nama:", error);
      setNameError(error.message || "Gagal mengubah nama.");
    } finally {
      btnConfirmName.disabled = false;
      btnConfirmName.textContent = "SIMPAN";
    }
  }

  function handleProfileNavigation() {
    if (!localStorage.getItem("token")) {
      openDialog(guestModal);
      return;
    }
    showNameStatus("");
    setProfileView(true);
    void fetchUserData();
  }

  window.addEventListener("recipe:navigate-profile", handleProfileNavigation);
  window.addEventListener("recipe:navigate-home", () => {
    setProfileView(false);
    [guestModal, logoutModal, nameDialog, nameSuccessDialog].forEach(
      (dialog) => {
        if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close();
      },
    );
  });

  btnModalLogin?.addEventListener("click", () => {
    if (guestModal instanceof HTMLDialogElement) guestModal.close();
    window.location.assign("login.html");
  });

  closeGuestModalBtn?.addEventListener("click", () => {
    if (guestModal instanceof HTMLDialogElement) guestModal.close();
  });

  btnNameSuccessClose?.addEventListener("click", () => {
    if (nameSuccessDialog instanceof HTMLDialogElement) {
      nameSuccessDialog.close();
    }
  });

  btnChangeName?.addEventListener("click", () => {
    if (!localStorage.getItem("token")) {
      openDialog(guestModal);
      return;
    }
    clearNameError();
    showNameStatus("");
    if (nameNextInput instanceof HTMLInputElement) {
      nameNextInput.value = fullnameBox?.textContent || "";
    }
    openDialog(nameDialog);
    nameNextInput?.focus();
  });

  btnCancelName?.addEventListener("click", () => {
    if (nameDialog instanceof HTMLDialogElement) nameDialog.close();
  });

  nameNextInput?.addEventListener("input", clearNameError);
  btnConfirmName?.addEventListener("click", () => void saveName());

  nameDialog?.addEventListener("close", () => {
    clearNameError();
    if (nameNextInput instanceof HTMLInputElement) {
      nameNextInput.value = fullnameBox?.textContent || "";
    }
  });

  btnTriggerLogout?.addEventListener("click", () => openDialog(logoutModal));
  btnCancelLogout?.addEventListener("click", () => {
    if (logoutModal instanceof HTMLDialogElement) logoutModal.close();
  });

  btnConfirmLogout?.addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.warn("Gagal meminta logout ke server:", error);
      }
    }

    clearAuthState();
    if (logoutModal instanceof HTMLDialogElement) logoutModal.close();
    setProfileView(false);
    window.dispatchEvent(new Event("recipe:navigate-home"));
    window.location.assign(window.location.pathname);
  });
}
