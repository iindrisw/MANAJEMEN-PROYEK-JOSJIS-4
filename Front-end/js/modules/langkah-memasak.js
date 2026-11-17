import { releaseWakeLock, requestWakeLock } from "./wakelock.js";
import { updateViewState } from "./view-state.js";

export function setupLangkahMemasak(recipe, detailScreen) {
  const stepsScreen = document.querySelector("#recipe-steps-screen");
  const stepsBackButton = document.querySelector("#steps-back");
  const stepsList = document.querySelector("#recipe-steps-list");
  const stepsRecipeTitle = document.querySelector("#steps-recipe-title");
  const detailStepsButton = document.querySelector("#detail-steps");
  const stepsLikeButton = document.querySelector("#steps-like");
  const stepsContent = document.querySelector(".steps-card-content");
  const modeButton = document.querySelector("#mode-memasak-button");
  const modeScreen = document.querySelector("#cooking-mode-screen");
  const modeBackButton = document.querySelector("#cooking-mode-back");
  const modeStepTitle = document.querySelector("#cooking-mode-step-title");
  const modeStepDescription = document.querySelector(
    "#cooking-mode-step-description",
  );
  const previousStepButton = document.querySelector("#cooking-mode-previous");
  const nextStepButton = document.querySelector("#cooking-mode-next");
  const nextStepLabel = document.querySelector("#cooking-mode-next-label");
  const nextStepIcon = document.querySelector("#cooking-mode-next-icon");

  if (
    !(stepsScreen instanceof HTMLElement) ||
    !(stepsBackButton instanceof HTMLButtonElement) ||
    !(stepsList instanceof HTMLOListElement) ||
    !(stepsRecipeTitle instanceof HTMLElement) ||
    !(detailStepsButton instanceof HTMLButtonElement) ||
    !(stepsLikeButton instanceof HTMLButtonElement) ||
    !(stepsContent instanceof HTMLElement) ||
    !(modeButton instanceof HTMLButtonElement) ||
    !(modeScreen instanceof HTMLElement) ||
    !(modeBackButton instanceof HTMLButtonElement) ||
    !(modeStepTitle instanceof HTMLElement) ||
    !(modeStepDescription instanceof HTMLElement) ||
    !(previousStepButton instanceof HTMLButtonElement) ||
    !(nextStepButton instanceof HTMLButtonElement) ||
    !(nextStepLabel instanceof HTMLElement) ||
    !(nextStepIcon instanceof HTMLImageElement)
  ) {
    throw new Error("Elemen halaman langkah memasak tidak ditemukan.");
  }

  const steps = Array.isArray(recipe.langkah) ? recipe.langkah : [];
  let currentStepIndex = 0;

  function fitRecipeTitle() {
    for (let fontSize = 36; fontSize >= 18; fontSize -= 1) {
      stepsRecipeTitle.style.fontSize = `${fontSize}px`;
      if (
        stepsRecipeTitle.scrollHeight <= stepsRecipeTitle.clientHeight + 1 &&
        stepsRecipeTitle.scrollWidth <= stepsRecipeTitle.clientWidth + 1
      ) {
        return;
      }
    }
  }

  function getStepDescription(step) {
    if (typeof step === "string") {
      return step;
    }
    return typeof step?.teks === "string" ? step.teks : "";
  }

  function renderScrollableSteps() {
    if (steps.length === 0) {
      const item = document.createElement("li");
      item.className = "step-item";
      item.textContent = "Langkah memasak belum tersedia untuk resep ini.";
      stepsList.replaceChildren(item);
      return;
    }

    stepsList.replaceChildren(
      ...steps.map((step, index) => {
        const item = document.createElement("li");
        item.className = "step-item";

        const title = document.createElement("strong");
        title.className = "step-item-title";
        title.textContent = `Langkah ${index + 1}:`;

        const description = document.createElement("p");
        description.className = "step-item-description";
        description.textContent = getStepDescription(step);

        item.append(title, description);
        return item;
      }),
    );
  }

  detailStepsButton.onclick = () => {
    renderScrollableSteps();
    void releaseWakeLock();
    modeScreen.hidden = true;
    stepsScreen.hidden = false;
    fitRecipeTitle();
    detailScreen.hidden = true;
    stepsContent.scrollTop = 0;
    window.scrollTo(0, 0);
    updateViewState({ screen: "steps" });
  };

  stepsBackButton.onclick = () => {
    void releaseWakeLock();
    stepsScreen.hidden = true;
    modeScreen.hidden = true;
    detailScreen.hidden = false;
    window.scrollTo(0, 0);
    updateViewState({ screen: null });
  };

  function renderCookingStep() {
    const step = steps[currentStepIndex];
    modeStepTitle.textContent = step
      ? `Langkah ${currentStepIndex + 1}:`
      : "Langkah belum tersedia";
    modeStepDescription.textContent = step
      ? getStepDescription(step)
      : "Langkah memasak belum tersedia untuk resep ini.";
    previousStepButton.disabled = currentStepIndex === 0;
    const isLastStep = currentStepIndex >= steps.length - 1;
    nextStepLabel.textContent = isLastStep ? "SELESAI" : "SELANJUTNYA";
    nextStepIcon.hidden = isLastStep;
    nextStepButton.disabled = steps.length === 0;
    updateViewState({ screen: "cooking", step: currentStepIndex + 1 });
  }

  function returnToSteps() {
    void releaseWakeLock();
    modeScreen.hidden = true;
    stepsScreen.hidden = false;
    updateViewState({ screen: "steps" });
  }

  function openCookingMode(startIndex) {
    currentStepIndex = startIndex;
    renderCookingStep();
    stepsScreen.hidden = true;
    modeScreen.hidden = false;
    void requestWakeLock();
    window.scrollTo(0, 0);
  }

  modeButton.onclick = () => openCookingMode(0);

  modeBackButton.onclick = returnToSteps;
  previousStepButton.onclick = () => {
    if (currentStepIndex > 0) {
      currentStepIndex -= 1;
      renderCookingStep();
    }
  };
  nextStepButton.onclick = () => {
    if (currentStepIndex >= steps.length - 1) {
      returnToSteps();
      return;
    }
    currentStepIndex += 1;
    renderCookingStep();
  };

  if (!stepsScreen.hidden) {
    renderScrollableSteps();
  }

  // Dipakai SEKALI saat halaman dimuat ulang dari URL (?screen=steps / cooking&step=N).
  // Render ulang biasa (mis. setelah like) tidak memanggil ini.
  function restore(state) {
    if (state?.screen !== "steps" && state?.screen !== "cooking") {
      return;
    }
    detailStepsButton.onclick(); // buka daftar langkah dulu (tujuan tombol kembali)
    if (state.screen === "cooking") {
      const lastIndex = Math.max(0, steps.length - 1);
      const wanted = Number.isInteger(state.step) ? state.step - 1 : 0;
      openCookingMode(Math.min(Math.max(wanted, 0), lastIndex));
    }
  }

  return { restore };
}