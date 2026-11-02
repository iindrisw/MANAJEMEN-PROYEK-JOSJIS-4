import { initInput } from "./modules/input.js";
import { initVoice } from "./modules/voice.js";
import { initHalamanSimpan } from "./modules/halaman-simpan.js";

const menuButton = document.querySelector("#menu-button");
const navigation = document.querySelector("#bottom-nav");
const drawerBackdrop = document.querySelector("#drawer-backdrop");
const brandLink = document.querySelector("[data-home-link]");

if (
  !(menuButton instanceof HTMLButtonElement) ||
  !(navigation instanceof HTMLElement) ||
  !(drawerBackdrop instanceof HTMLButtonElement) ||
  !(brandLink instanceof HTMLAnchorElement)
) {
  throw new Error("Elemen navigasi tidak ditemukan.");
}

menuButton.addEventListener("click", () => {
  const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
  setNavigationOpen(!isExpanded);
});

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

brandLink.addEventListener("click", (event) => {
  event.preventDefault();
  window.dispatchEvent(new Event("recipe:navigate-home"));
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
      setActiveNavigation("home");
      window.dispatchEvent(new Event("recipe:navigate-home"));
    } else if (link.dataset.navAction === "bookmark") {
      if (!localStorage.getItem("token")) {
        const dialog = document.querySelector("#bookmark-unavailable-dialog");
        if (!(dialog instanceof HTMLDialogElement)) {
          throw new Error("Dialog validasi login tidak ditemukan.");
        }
        if (!dialog.open) {
          dialog.showModal();
        }
        return;
      }
      setActiveNavigation("bookmark");
      window.dispatchEvent(new Event("recipe:navigate-saved"));
    } else if (link.dataset.navAction === "login" || link.dataset.navAction === "profile") {
      const dialog = document.querySelector("#bookmark-unavailable-dialog");
      if (!(dialog instanceof HTMLDialogElement)) {
        throw new Error("Dialog validasi login tidak ditemukan.");
      }
      if (!dialog.open) {
        dialog.showModal();
      }
    }
  }
});

window.addEventListener("recipe:saved-auth-required", () => {
  setActiveNavigation("home");
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