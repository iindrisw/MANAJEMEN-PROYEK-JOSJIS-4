import { initInput } from "./modules/input.js";
import { initVoice } from "./modules/voice.js";
import { initHalamanSimpan } from "./modules/halaman-simpan.js";
import { initHumberger } from "./hamburger.js";
import { initProfile } from "./modules/profil.js";
import { initUbahKataSandi } from "./modules/ubah-katasandi.js";
import { readViewState } from "./modules/view-state.js";

const initialViewState = readViewState();
const startupLoaderMessage = document.querySelector("#startup-loader-message");
if (startupLoaderMessage instanceof HTMLElement) {
  if (initialViewState.recipe && initialViewState.screen === "cooking") {
    startupLoaderMessage.textContent = "Memuat Mode memasak...";
  } else if (initialViewState.recipe && initialViewState.screen === "steps") {
    startupLoaderMessage.textContent = "Memuat Langkah memasak...";
  } else if (initialViewState.recipe) {
    startupLoaderMessage.textContent = "Memuat detail resep...";
  } else if (initialViewState.view === "saved") {
    startupLoaderMessage.textContent = "Memuat halaman resep tersimpan...";
  } else if (initialViewState.view === "profile") {
    startupLoaderMessage.textContent = "Memuat...";
  } else {
    startupLoaderMessage.textContent = "Memuat resep...";
  }
}

initHumberger();
const input = initInput();
initVoice();
const savedViewReady = initHalamanSimpan();
const profileViewReady = initProfile();
initUbahKataSandi();

// PALING AKHIR: pulihkan layar detail / langkah / mode memasak dari URL, supaya
// halaman simpan atau profil yang dipulihkan lebih dulu tidak menimpanya.
const restoredRecipeReady = input.restoreFromUrl();

const startupLoader = document.querySelector("#startup-loader");
const hasRestoredPage = Boolean(
  initialViewState.recipe ||
    initialViewState.view === "saved" ||
    initialViewState.view === "profile",
);
if (startupLoader instanceof HTMLElement && hasRestoredPage) {
  const startupReady = initialViewState.recipe
    ? restoredRecipeReady
    : initialViewState.view === "saved"
      ? savedViewReady
      : initialViewState.view === "profile"
        ? profileViewReady
        : input.initialLoad;
  const hideStartupLoader = () => {
    requestAnimationFrame(() => {
      startupLoader.classList.add("is-hidden");
    });
  };

  void Promise.resolve(startupReady).then(hideStartupLoader, (error) => {
    console.error("Gagal memuat halaman awal:", error);
    hideStartupLoader();
  });
}
