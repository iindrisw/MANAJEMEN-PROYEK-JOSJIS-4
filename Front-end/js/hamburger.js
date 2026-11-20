export function initHumberger() {
  const menuButtons = document.querySelectorAll(".menu-button");
  const navigation = document.querySelector("#bottom-nav");
  const drawerBackdrop = document.querySelector("#drawer-backdrop");
  const signupLink = navigation?.querySelector(".drawer-signup");
  const brandLinks = document.querySelectorAll("[data-home-link]");
  const bookmarkUnavailableDialog = document.querySelector(
    "#bookmark-unavailable-dialog",
  );

  if (
    menuButtons.length === 0 ||
    !(navigation instanceof HTMLElement) ||
    !(drawerBackdrop instanceof HTMLButtonElement) ||
    !(signupLink instanceof HTMLAnchorElement) ||
    brandLinks.length === 0 ||
    !(bookmarkUnavailableDialog instanceof HTMLDialogElement)
  ) {
    throw new Error("Elemen navigasi tidak ditemukan.");
  }

  function getStoredUserName() {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      return "";
    }

    try {
      const user = JSON.parse(storedUser);
      if (!user || typeof user !== "object" || Array.isArray(user)) {
        return "";
      }

      for (const name of [user.nama, user.nama_lengkap, user.name]) {
        if (typeof name === "string" && name.trim()) {
          return name.trim();
        }
      }
    } catch (error) {
      console.error("Data pengguna tersimpan tidak valid:", error);
    }

    return "";
  }

  function updateSignupLink() {
    if (!localStorage.getItem("token")) {
      signupLink.href = "register.html";
      signupLink.textContent = "Daftar atau Masuk";
      signupLink.dataset.navAction = "signup";
      return;
    }

    const name = getStoredUserName();
    signupLink.href = "#";
    signupLink.textContent = name ? `Halo ${name}` : "Halo";
    signupLink.dataset.navAction = "profile";
  }

  updateSignupLink();
  window.addEventListener("storage", (event) => {
    if (event.key === "token" || event.key === "user" || event.key === null) {
      updateSignupLink();
    }
  });
  window.addEventListener("pageshow", updateSignupLink);
  window.addEventListener("recipe:profile-updated", updateSignupLink);

  function getActiveMenuButton() {
    // Cari tombol menu yang sedang terlihat/tidak tersembunyi di layar aktif
    for (const btn of menuButtons) {
      if (btn.offsetParent !== null) {
        return btn;
      }
    }
    return menuButtons[0];
  }

  function setNavigationOpen(isOpen) {
    const currentMenuButton = getActiveMenuButton();
    currentMenuButton.setAttribute("aria-expanded", String(isOpen));
    currentMenuButton.setAttribute(
      "aria-label",
      isOpen ? "Tutup navigasi" : "Buka navigasi",
    );
    navigation.setAttribute("aria-hidden", String(!isOpen));
    drawerBackdrop.setAttribute("aria-hidden", String(!isOpen));
    navigation.inert = !isOpen;
    drawerBackdrop.inert = !isOpen;

    if (isOpen) {
      navigation.hidden = false;
      drawerBackdrop.hidden = false;
      requestAnimationFrame(() => {
        if (currentMenuButton.getAttribute("aria-expanded") === "true") {
          navigation.classList.add("is-open");
          drawerBackdrop.classList.add("is-open");
        }
      });
      return;
    }

    navigation.classList.remove("is-open");
    drawerBackdrop.classList.remove("is-open");
  }

  function setActiveNavigation(action) {
    for (const link of navigation.querySelectorAll("[data-nav-action]")) {
      const isActive = link.dataset.navAction === action;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  // Pasang event listener ke semua tombol hamburger di setiap halaman
  menuButtons.forEach((menuButton) => {
    menuButton.addEventListener("click", () => {
      const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
      setNavigationOpen(!isExpanded);
    });
  });

  drawerBackdrop.addEventListener("click", () => {
    setNavigationOpen(false);
    const currentMenuButton = getActiveMenuButton();
    currentMenuButton.focus();
  });

  // Pasang event listener ke semua logo brand
  brandLinks.forEach((brandLink) => {
    brandLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.assign(window.location.pathname);
    });
  });

  navigation.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const link = event.target.closest("[data-menu-link]");
    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }

    const action = link.dataset.navAction;
    const isGuest = !localStorage.getItem("token");
    if (action === "signup" && isGuest) {
      event.preventDefault();
      setNavigationOpen(false);
      window.location.assign(link.href);
      return;
    }

    event.preventDefault();

    if (isGuest && (action === "bookmark" || action === "profile")) {
      setActiveNavigation(action === "bookmark" ? "bookmark" : "home");
      window.dispatchEvent(
        new Event(
          action === "bookmark"
            ? "recipe:navigate-saved"
            : "recipe:navigate-profile",
        ),
      );
      return;
    }

    setNavigationOpen(false);
    const currentMenuButton = getActiveMenuButton();
    currentMenuButton.focus();

    if (action === "home") {
      window.location.assign(window.location.pathname);
    } else if (action === "bookmark") {
      setActiveNavigation("bookmark");
      window.dispatchEvent(new Event("recipe:navigate-saved"));
    } else if (action === "profile") {
      setActiveNavigation("profile");
      window.dispatchEvent(new Event("recipe:navigate-profile"));
    }
  });

  // Halaman simpan / profil dipulihkan setelah refresh -> sorot menunya di drawer.
  window.addEventListener("recipe:saved-view-restored", () => {
    setActiveNavigation("bookmark");
  });
  window.addEventListener("recipe:profile-view-restored", () => {
    setActiveNavigation("profile");
  });

  window.addEventListener("recipe:login-request", () => {
    setActiveNavigation("profile");
    window.dispatchEvent(new Event("recipe:auth-required"));
  });

  window.addEventListener("recipe:login-success", () => {
    updateSignupLink();
    setActiveNavigation("home");
    window.dispatchEvent(new Event("recipe:navigate-home"));
  });

  window.addEventListener("recipe:saved-auth-required", () => {
    window.dispatchEvent(new Event("recipe:auth-required"));
  });

  window.addEventListener("recipe:auth-required", () => {
    if (!bookmarkUnavailableDialog.open) {
      bookmarkUnavailableDialog.showModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    const currentMenuButton = getActiveMenuButton();
    if (
      event.key === "Escape" &&
      currentMenuButton.getAttribute("aria-expanded") === "true"
    ) {
      setNavigationOpen(false);
      currentMenuButton.focus();
    }
  });
}