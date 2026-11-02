import { initInput } from "./modules/input.js";
import { initVoice } from "./modules/voice.js";
import { initHalamanSimpan } from "./modules/halaman-simpan.js";
import { initLogin } from "./modules/login.js";

const menuButton = document.querySelector("#menu-button");
const navigation = document.querySelector("#bottom-nav");
const drawerBackdrop = document.querySelector("#drawer-backdrop");
const brandLink = document.querySelector("[data-home-link]");
const bookmarkLoginButton = document.querySelector("#bookmark-unavailable-login");

if (
  !(menuButton instanceof HTMLButtonElement) ||
  !(navigation instanceof HTMLElement) ||
  !(drawerBackdrop instanceof HTMLButtonElement) ||
  !(brandLink instanceof HTMLAnchorElement) ||
  !(bookmarkLoginButton instanceof HTMLButtonElement)
) {
  throw new Error("Elemen navigasi tidak ditemukan.");
}

menuButton.addEventListener("click", () => {
  const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
  setNavigationOpen(!isExpanded);
});

function reloadHome() {
  window.location.assign(window.location.pathname);
}

function setNavigationOpen(isOpen) {
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Tutup navigasi" : "Buka navigasi");
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

drawerBackdrop.addEventListener("click", () => {
  setNavigationOpen(false);
});

bookmarkLoginButton.addEventListener("click", () => {
  window.dispatchEvent(new Event("recipe:login-request"));
});

brandLink.addEventListener("click", (event) => {
  event.preventDefault();
  reloadHome();
});

navigation.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const link = event.target.closest("[data-menu-link]");
  if (link instanceof HTMLAnchorElement) {
    event.preventDefault();
    setNavigationOpen(false);
    menuButton.focus();
    if (link.dataset.navAction === "home") {
      reloadHome();
    } else if (link.dataset.navAction === "bookmark") {
      setActiveNavigation("bookmark");
      window.dispatchEvent(new Event("recipe:navigate-saved"));
    } else if (link.dataset.navAction === "login" || link.dataset.navAction === "profile") {
      setActiveNavigation(link.dataset.navAction === "profile" ? "profile" : "home");
      window.dispatchEvent(new Event("recipe:navigate-login"));
    }
  }
});

window.addEventListener("recipe:login-request", () => {
  const dialog = document.querySelector("#bookmark-unavailable-dialog");
  if (dialog instanceof HTMLDialogElement && dialog.open) {
    dialog.close();
  }
  setActiveNavigation("profile");
  window.dispatchEvent(new Event("recipe:navigate-login"));
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

  const dialog = document.querySelector("#bookmark-unavailable-dialog");
  if (dialog instanceof HTMLDialogElement && !dialog.open) {
    dialog.showModal();
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

initInput();
initVoice();
initHalamanSimpan();
initLogin();