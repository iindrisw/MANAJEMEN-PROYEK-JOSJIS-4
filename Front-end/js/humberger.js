export function initHumberger() {
  const menuButton = document.querySelector("#menu-button");
  const navigation = document.querySelector("#bottom-nav");
  const drawerBackdrop = document.querySelector("#drawer-backdrop");
  const brandLink = document.querySelector("[data-home-link]");
  const bookmarkUnavailableDialog = document.querySelector(
    "#bookmark-unavailable-dialog",
  );

  if (
    !(menuButton instanceof HTMLButtonElement) ||
    !(navigation instanceof HTMLElement) ||
    !(drawerBackdrop instanceof HTMLButtonElement) ||
    !(brandLink instanceof HTMLAnchorElement) ||
    !(bookmarkUnavailableDialog instanceof HTMLDialogElement)
  ) {
    throw new Error("Elemen navigasi tidak ditemukan.");
  }

  function setNavigationOpen(isOpen) {
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute(
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
        if (menuButton.getAttribute("aria-expanded") === "true") {
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

  menuButton.addEventListener("click", () => {
    const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
    setNavigationOpen(!isExpanded);
  });

  drawerBackdrop.addEventListener("click", () => {
    setNavigationOpen(false);
    menuButton.focus();
  });

  brandLink.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.assign(window.location.pathname);
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
    menuButton.focus();

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
    if (
      event.key === "Escape" &&
      menuButton.getAttribute("aria-expanded") === "true"
    ) {
      setNavigationOpen(false);
      menuButton.focus();
    }
  });
}
