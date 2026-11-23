import { readViewState, updateViewState } from "./view-state.js";
import {
  API_BASE_URL,
  isNetworkConnectionError,
  NETWORK_CONNECTION_ERROR_MESSAGE,
} from "./api.js";

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

  function readStoredUser() {
    const storedUserValue = localStorage.getItem("user");
    if (!storedUserValue) return {};

    try {
      const parsedUser = JSON.parse(storedUserValue);
      if (parsedUser && typeof parsedUser === "object" && !Array.isArray(parsedUser)) {
        return parsedUser;
      }
      console.error("Data pengguna tersimpan tidak valid.");
    } catch (error) {
      console.error("Data pengguna tersimpan tidak valid:", error);
    }
    return {};
  }

  function cacheUpdatedUserName(name, updatedUser) {
    const storedUser = readStoredUser();
    const responseUser =
      updatedUser && typeof updatedUser === "object" && !Array.isArray(updatedUser)
        ? updatedUser
        : {};
    const updatedName =
      [responseUser.nama, responseUser.nama_lengkap, responseUser.name].find(
        (value) => typeof value === "string" && value.trim(),
      )?.trim() || name;

    localStorage.setItem(
      "user",
      JSON.stringify({ ...storedUser, ...responseUser, nama: updatedName }),
    );
    window.dispatchEvent(new Event("recipe:profile-updated"));
    return updatedName;
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
        updateViewState({ view: null });
        setProfileView(false);
        openDialog(guestModal);
        return;
      }
      showNameStatus(
        isNetworkConnectionError(error)
          ? NETWORK_CONNECTION_ERROR_MESSAGE
          : error.message || "Gagal memuat data profil.",
        true,
      );
    }
  }

  async function saveName() {
    const token = localStorage.getItem("token");
    const rawName = nameNextInput instanceof HTMLInputElement ? nameNextInput.value : "";
    const namaBaru = rawName.trim();

    clearNameError();
    if (namaBaru.length === 0) {
      setNameError("Kolom ini wajib diisi");
      if (nameNextInput instanceof HTMLInputElement) nameNextInput.focus();
      return;
    }
    if (namaBaru.length > 64) {
      setNameError("Nama lengkap maksimal 64 karakter");
      if (nameNextInput instanceof HTMLInputElement) nameNextInput.focus();
      return;
    }
    if (!token) {
      if (nameDialog instanceof HTMLDialogElement) nameDialog.close();
      openDialog(guestModal);
      return;
    }

    const confirmBtn =
      btnConfirmName instanceof HTMLButtonElement ? btnConfirmName : null;
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Menyimpan...";
    }

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
      const updatedName = cacheUpdatedUserName(namaBaru, updatedUser);
      if (fullnameBox) fullnameBox.textContent = updatedName;
      if (nameDialog instanceof HTMLDialogElement) nameDialog.close();
      showNameStatus("");
      openDialog(nameSuccessDialog);
    } catch (error) {
      console.error("Gagal mengubah nama:", error);
      setNameError(
        isNetworkConnectionError(error)
          ? NETWORK_CONNECTION_ERROR_MESSAGE
          : error.message || "Gagal mengubah nama.",
      );
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = "SIMPAN";
      }
    }
  }

  function getCurrentDisplayName() {
    const currentText = fullnameBox?.textContent?.trim();
    if (currentText && currentText !== "Memuat...") return currentText;
    const storedUser = readStoredUser();
    return storedUser.nama || storedUser.nama_lengkap || storedUser.name || "";
  }

  function handleProfileNavigation() {
    if (!localStorage.getItem("token")) {
      openDialog(guestModal);
      return;
    }
    showNameStatus("");
    setProfileView(true);
    updateViewState({ view: "profile", recipe: null });
    void fetchUserData();
  }

  window.addEventListener("recipe:navigate-profile", handleProfileNavigation);
  window.addEventListener("recipe:navigate-home", () => {
    updateViewState({ view: null });
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
      nameNextInput.value = getCurrentDisplayName();
    }
    openDialog(nameDialog);
    if (nameNextInput instanceof HTMLInputElement) nameNextInput.focus();
  });

  btnCancelName?.addEventListener("click", () => {
    if (nameDialog instanceof HTMLDialogElement) nameDialog.close();
  });

  nameNextInput?.addEventListener("input", clearNameError);
  btnConfirmName?.addEventListener("click", () => void saveName());

  nameDialog?.addEventListener("close", () => {
    clearNameError();
    if (nameNextInput instanceof HTMLInputElement) {
      nameNextInput.value = getCurrentDisplayName();
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
    window.location.assign(window.location.pathname);
  });

  // Pulihkan halaman profil setelah refresh (?view=profile). Tanpa login tidak ada
  // profil untuk ditampilkan; layar detail (?recipe=) diutamakan.
  const restored = readViewState();
  if (restored.view === "profile") {
    if (restored.recipe || !localStorage.getItem("token")) {
      updateViewState({ view: null });
    } else {
      setProfileView(true);
      window.dispatchEvent(new Event("recipe:profile-view-restored"));
      void fetchUserData();
    }
  }
}