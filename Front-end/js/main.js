import { initInput } from "./modules/input.js";
import { initVoice } from "./modules/voice.js";
import { initHalamanSimpan } from "./modules/halaman-simpan.js";
import { initHumberger } from "./hamburger.js";
import { initProfile } from "./modules/profil.js";
import { initUbahKataSandi } from "./modules/ubah-katasandi.js";

initHumberger();
const input = initInput();
initVoice();
initHalamanSimpan();
initProfile();
initUbahKataSandi();

// PALING AKHIR: pulihkan layar detail / langkah / mode memasak dari URL, supaya
// halaman simpan atau profil yang dipulihkan lebih dulu tidak menimpanya.
void input.restoreFromUrl();
