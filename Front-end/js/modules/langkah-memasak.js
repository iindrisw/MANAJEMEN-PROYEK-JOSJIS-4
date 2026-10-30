import { requestWakeLock, releaseWakeLock } from './wakelock.js';

export function setupLangkahMemasak(recipe, detailScreen, feedback) {
  const stepsScreen = document.querySelector("#recipe-steps-screen");
  const stepsBackButton = document.querySelector("#steps-back");
  const stepsList = document.querySelector("#recipe-steps-list");
  const detailStepsButton = document.querySelector("#detail-steps");
  const modeMemasakButton = document.querySelector("#mode-memasak-button"); // Tombol merah "MODE MEMASAK" di halaman daftar langkah

  if (!stepsScreen || !stepsList) return;

  const steps = Array.isArray(recipe.langkah) ? recipe.langkah : [];

  // 1. Fungsi untuk Merender Tampilan Daftar Langkah Memanjang ke Bawah (Sesuai Desain Gambar)
  function renderScrollableSteps() {
    if (steps.length === 0) {
      if (feedback) {
        feedback.textContent = "Langkah memasak belum tersedia untuk resep ini.";
        feedback.hidden = false;
      }
      return;
    }

    // Render setiap langkah ke dalam card list berurutan ke bawah
    stepsList.replaceChildren(
      ...steps.map((step, index) => {
        const item = document.createElement("li");
        item.className = "step-item"; // Bisa disesuaikan dengan class CSS card langkah di Figma

        const stepTitle = document.createElement("strong");
        stepTitle.textContent = `Langkah ${index + 1}:`;
        
        const stepDesc = document.createElement("p");
        stepDesc.textContent = typeof step === "string" ? step : step.teks || "";

        item.append(stepTitle, stepDesc);
        return item;
      })
    );
  }

  // Ketika tombol "Lihat Langkah - Langkah" di halaman detail ditekan
  if (detailStepsButton) {
    detailStepsButton.onclick = () => {
      renderScrollableSteps();
      if (detailScreen) detailScreen.hidden = true;
      stepsScreen.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }

  // 2. Tombol Navigasi Kembali (Back Button / Tanda Panah)
  if (stepsBackButton) {
    stepsBackButton.onclick = () => {
      stepsScreen.hidden = true;
      if (detailScreen) detailScreen.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }

  // 3. Tombol "MODE MEMASAK" (Mengaktifkan mode interaktif per satu langkah)
  if (modeMemasakButton) {
    modeMemasakButton.onclick = () => {
      // Panggil fungsi atau logika perpindahan ke mode interaktif satu per satu layar penuh di sini
      console.log("Mode Memasak diaktifkan!");
    };
  }
}