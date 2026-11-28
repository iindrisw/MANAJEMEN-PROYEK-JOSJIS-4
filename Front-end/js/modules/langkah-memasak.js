import { releaseWakeLock, requestWakeLock } from "./wakelock.js";
import { updateViewState } from "./view-state.js";

export function setupLangkahMemasak(recipe, detailScreen) {
  const stepsScreen = document.querySelector("#recipe-steps-screen");
  const stepsBackButton = document.querySelector("#steps-back");
  const stepsList = document.querySelector("#recipe-steps-list");
  const stepsEmptyState = document.querySelector("#recipe-steps-empty-state");
  const stepsRecipeTitle = document.querySelector("#steps-recipe-title");
  const detailStepsButton = document.querySelector("#detail-steps");
  const stepsLikeButton = document.querySelector("#steps-like");
  const stepsContent = document.querySelector(".steps-card-content");
  const modeButton = document.querySelector("#mode-memasak-button");
  const modeScreen = document.querySelector("#cooking-mode-screen");
  const modeStep = document.querySelector(".cooking-mode-step");
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
    !(stepsEmptyState instanceof HTMLElement) ||
    !(stepsRecipeTitle instanceof HTMLElement) ||
    !(detailStepsButton instanceof HTMLButtonElement) ||
    !(stepsLikeButton instanceof HTMLButtonElement) ||
    !(stepsContent instanceof HTMLElement) ||
    !(modeButton instanceof HTMLButtonElement) ||
    !(modeScreen instanceof HTMLElement) ||
    !(modeStep instanceof HTMLElement) ||
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

  const recipeSteps = Array.isArray(recipe.langkah) ? recipe.langkah : [];
  const emptyModeMessage =
    recipeSteps.length > 0
      ? "Tidak ada Langkah-Langkah"
      : "Mode memasak tidak tersedia";
  let currentStepIndex = 0;

  function getStepDescriptions(step) {
    const description =
      typeof step === "string"
        ? step
        : typeof step?.teks === "string"
          ? step.teks
          : "";
    const normalizedDescription = description
      .replace(/\\r\\n|\\n/g, "\n")
      .replace(/\r\n?/g, "\n")
      .replace(/^\s*Langkah\s*(?:\n|$)/i, "")
      .trim()
      .replace(/,(?=\S)/g, ", ");

    return normalizedDescription
      .split(/(?:^|\n)\s*\d+[.)]\s*/)
      .map((instruction) => instruction.trim())
      .filter(Boolean);
  }

  const steps = recipeSteps.flatMap(getStepDescriptions);
  let stepsRenderToken = 0;
  let cookingRenderToken = 0;

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

  function renderScrollableSteps() {
    stepsEmptyState.classList.remove("is-loading");
    stepsScreen.removeAttribute("aria-busy");

    if (steps.length === 0) {
      stepsList.replaceChildren();
      stepsEmptyState.textContent = "Langkah memasak tidak tersedia";
      stepsEmptyState.hidden = false;
      return;
    }

    stepsEmptyState.hidden = true;
    stepsList.replaceChildren(
      ...steps.map((step, index) => {
        const item = document.createElement("li");
        item.className = "step-item";

        const title = document.createElement("strong");
        title.className = "step-item-title";
        title.textContent = `Langkah ${index + 1}:`;

        const description = document.createElement("p");
        description.className = "step-item-description";
        description.textContent = step;

        item.append(title, description);
        return item;
      }),
    );
  }

  function openStepsScreen(showLoading = true) {
    const renderToken = ++stepsRenderToken;
    void releaseWakeLock();
    modeScreen.hidden = true;
    stepsScreen.hidden = false;
    fitRecipeTitle();
    detailScreen.hidden = true;
    stepsContent.scrollTop = 0;
    window.scrollTo(0, 0);
    updateViewState({ screen: "steps" });

    if (!showLoading) {
      renderScrollableSteps();
      return;
    }

    stepsList.replaceChildren();
    stepsEmptyState.textContent = "Memuat Langkah memasak...";
    stepsEmptyState.classList.add("is-loading");
    stepsEmptyState.hidden = false;
    stepsScreen.setAttribute("aria-busy", "true");

    requestAnimationFrame(() => {
      if (renderToken !== stepsRenderToken || stepsScreen.hidden) {
        return;
      }
      requestAnimationFrame(() => {
        if (renderToken !== stepsRenderToken || stepsScreen.hidden) {
          return;
        }
        renderScrollableSteps();
      });
    });
  }

  detailStepsButton.onclick = () => openStepsScreen();

  stepsBackButton.onclick = () => {
    stepsRenderToken += 1;
    stepsScreen.removeAttribute("aria-busy");
    stepsEmptyState.classList.remove("is-loading");
    stepsEmptyState.hidden = true;
    void releaseWakeLock();
    stepsScreen.hidden = true;
    modeScreen.hidden = true;
    detailScreen.hidden = false;
    window.scrollTo(0, 0);
    updateViewState({ screen: null });
  };

  function renderCookingStep() {
    modeStep.classList.remove("is-loading");
    modeStep.removeAttribute("aria-busy");
    const step = steps[currentStepIndex];
    const hasSteps = steps.length > 0;
    modeStep.classList.toggle("is-empty", !hasSteps);
    modeStepTitle.textContent = step
      ? `Langkah ${currentStepIndex + 1}:`
      : "";
    modeStepDescription.textContent = step
      ? step
      : emptyModeMessage;
    previousStepButton.disabled = !hasSteps || currentStepIndex === 0;
    const isLastStep = currentStepIndex >= steps.length - 1;
    nextStepLabel.textContent =
      hasSteps && isLastStep ? "SELESAI" : "SELANJUTNYA";
    nextStepIcon.hidden = hasSteps && isLastStep;
    nextStepButton.disabled = !hasSteps;
    updateViewState({ screen: "cooking", step: currentStepIndex + 1 });
  }

  function openCookingMode(startIndex, showLoading = true) {
    currentStepIndex = startIndex;
    const renderToken = ++cookingRenderToken;
    if (stepsScreen.getAttribute("aria-busy") === "true") {
      stepsRenderToken += 1;
      renderScrollableSteps();
    }
    stepsScreen.hidden = true;
    modeScreen.hidden = false;
    void requestWakeLock();
    window.scrollTo(0, 0);

    if (!showLoading) {
      renderCookingStep();
      return;
    }

    modeStep.classList.remove("is-empty");
    modeStep.classList.add("is-loading");
    modeStep.setAttribute("aria-busy", "true");
    modeStepTitle.textContent = "";
    modeStepDescription.textContent = "Memuat Mode memasak...";
    previousStepButton.disabled = true;
    nextStepButton.disabled = false;
    nextStepLabel.textContent = "SELANJUTNYA";
    nextStepIcon.hidden = false;

    requestAnimationFrame(() => {
      if (renderToken !== cookingRenderToken || modeScreen.hidden) {
        return;
      }
      requestAnimationFrame(() => {
        if (renderToken !== cookingRenderToken || modeScreen.hidden) {
          return;
        }
        renderCookingStep();
      });
    });
  }

  function returnToSteps() {
    cookingRenderToken += 1;
    modeStep.classList.remove("is-loading");
    modeStep.removeAttribute("aria-busy");
    void releaseWakeLock();
    modeScreen.hidden = true;
    stepsScreen.hidden = false;
    updateViewState({ screen: "steps" });
  }

  modeButton.onclick = () => openCookingMode(0);

  modeBackButton.onclick = returnToSteps;
  previousStepButton.onclick = () => {
    if (!modeStep.classList.contains("is-loading") && currentStepIndex > 0) {
      currentStepIndex -= 1;
      renderCookingStep();
    }
  };
  nextStepButton.onclick = () => {
    if (modeStep.classList.contains("is-loading")) {
      return;
    }
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
    openStepsScreen(false);
    if (state.screen === "cooking") {
      const lastIndex = Math.max(0, steps.length - 1);
      const wanted = Number.isInteger(state.step) ? state.step - 1 : 0;
      openCookingMode(Math.min(Math.max(wanted, 0), lastIndex), false);
    }
  }

  return { restore };
}