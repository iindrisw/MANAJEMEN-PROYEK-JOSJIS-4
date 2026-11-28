export function initHumberger() {
  const menuButtons = document.querySelectorAll(".menu-button");
  const navigation = document.querySelector("#bottom-nav");
  const drawerBackdrop = document.querySelector("#drawer-backdrop");
  const signupLink = navigation?.querySelector(".drawer-signup");
  const drawerLinks = navigation?.querySelectorAll(".drawer-link") ?? [];
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

  function detectCurrentNavAction() {
    const appShell = document.querySelector(".app-shell");
    const profileScreen = document.querySelector("#view-profile");
    const savedScreen = document.querySelector("#view-saved");

    if (
      appShell?.classList.contains("is-profile-view") ||
      (profileScreen instanceof HTMLElement && !profileScreen.hidden)
    ) {
      return "profile";
    }

    if (
      appShell?.classList.contains("is-saved-view") ||
      (savedScreen instanceof HTMLElement && !savedScreen.hidden)
    ) {
      return "bookmark";
    }

    return "home";
  }

  function updateActiveDrawerLink(forcedAction) {
    const activeAction = forcedAction || detectCurrentNavAction();

    for (const link of drawerLinks) {
      if (!(link instanceof HTMLAnchorElement)) {
        continue;
      }
      const isCurrent = link.dataset.navAction === activeAction;
      link.classList.toggle("is-active", isCurrent);
      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  updateSignupLink();
  updateActiveDrawerLink("home");

  window.addEventListener("storage", (event) => {
    if (event.key === "token" || event.key === "user" || event.key === null) {
      updateSignupLink();
    }
  });
  window.addEventListener("pageshow", () => {
    updateSignupLink();
    updateActiveDrawerLink();
  });
  window.addEventListener("recipe:profile-updated", updateSignupLink);
  window.addEventListener("recipe:navigate-home", () => {
    updateActiveDrawerLink("home");
  });
  window.addEventListener("recipe:navigate-saved", () => {
    updateActiveDrawerLink("bookmark");
  });
  window.addEventListener("recipe:navigate-profile", () => {
    updateActiveDrawerLink("profile");
  });

  function getActiveMenuButton() {
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
      updateActiveDrawerLink();
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

  brandLinks.forEach((brandLink) => {
    brandLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.dispatchEvent(new Event("recipe:navigate-home"));
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
      window.dispatchEvent(
        new Event(
          action === "bookmark"
            ? "recipe:navigate-saved"
            : "recipe:navigate-profile",
        ),
      );
      return;
    }

    if (action === "home" || action === "bookmark" || action === "profile") {
      updateActiveDrawerLink(action);
    }

    setNavigationOpen(false);
    const currentMenuButton = getActiveMenuButton();
    currentMenuButton.focus();

    if (action === "home") {
      window.dispatchEvent(new Event("recipe:navigate-home"));
    } else if (action === "bookmark") {
      window.dispatchEvent(new Event("recipe:navigate-saved"));
    } else if (action === "profile") {
      window.dispatchEvent(new Event("recipe:navigate-profile"));
    }
  });

  window.addEventListener("recipe:login-request", () => {
    window.dispatchEvent(new Event("recipe:auth-required"));
  });

  window.addEventListener("recipe:login-success", () => {
    updateSignupLink();
    updateActiveDrawerLink("home");
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