import { initInput } from "./modules/input.js";
import { initVoice } from "./modules/voice.js";

const menuButton = document.querySelector("#menu-button");
const navigation = document.querySelector("#bottom-nav");
const drawerBackdrop = document.querySelector("#drawer-backdrop");

if (
  !(menuButton instanceof HTMLButtonElement) ||
  !(navigation instanceof HTMLElement) ||
  !(drawerBackdrop instanceof HTMLButtonElement)
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

drawerBackdrop.addEventListener("click", () => {
  setNavigationOpen(false);
});

navigation.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const link = event.target.closest("[data-menu-link]");
  if (link instanceof HTMLAnchorElement) {
    event.preventDefault();
    setNavigationOpen(false);
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