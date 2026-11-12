export function initHumberger() {
  const menuButtons = document.querySelectorAll("#menu-button");
  const navigation = document.querySelector("#bottom-nav");
  const drawerBackdrop = document.querySelector("#drawer-backdrop");
  const brandLinks = document.querySelectorAll("[data-home-link]");
  const bookmarkUnavailableDialog = document.querySelector(
    "#bookmark-unavailable-dialog",
  );

  if (
    menuButtons.length === 0 ||
    !(navigation instanceof HTMLElement) ||
    !(drawerBackdrop instanceof HTMLButtonElement) ||
    brandLinks.length === 0 ||
    !(bookmarkUnavailableDialog instanceof HTMLDialogElement)
  ) {
    throw new Error("Elemen navigasi tidak ditemukan.");
  }

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

    event.preventDefault();
    setNavigationOpen(false);
    const currentMenuButton = getActiveMenuButton();
    currentMenuButton.focus();

    if (link.dataset.navAction === "home") {
      window.location.assign(window.location.pathname);
    } else if (link.dataset.navAction === "bookmark") {
      setActiveNavigation("bookmark");
      window.dispatchEvent(new Event("recipe:navigate-saved"));
    } else if (link.dataset.navAction === "profile") {
      setActiveNavigation("profile");
      window.dispatchEvent(new Event("recipe:navigate-profile"));
    }
  });

  window.addEventListener("recipe:login-request", () => {
    setActiveNavigation("profile");
    window.dispatchEvent(new Event("recipe:auth-required"));
  });

  window.addEventListener("recipe:login-success", () => {
    setActiveNavigation("home");
    window.dispatchEvent(new Event("recipe:navigate-home"));
  });

  window.addEventListener("recipe:saved-auth-required", () => {
    const savedScreen = document.querySelector("#view-saved");
    if (!(savedScreen instanceof HTMLElement) || savedScreen.hidden) {
      setActiveNavigation("home");
    }

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