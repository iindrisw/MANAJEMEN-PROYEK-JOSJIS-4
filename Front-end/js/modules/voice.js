function showVoiceError(message) {
  const dialog = document.querySelector("#validation-dialog");
  const dialogMessage = document.querySelector("#validation-message");

  if (dialog instanceof HTMLDialogElement && dialogMessage) {
    dialogMessage.textContent = message;
    if (!dialog.open) {
      dialog.showModal();
    }
    return;
  }

  window.alert(message);
}

function getRecognitionErrorMessage(error) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Izin mikrofon ditolak. Izinkan akses mikrofon melalui pengaturan browser.";
  }
  if (error === "no-speech") {
    return "Suara tidak terdengar. Silakan coba lagi.";
  }
  return "Input suara gagal. Silakan coba lagi.";
}

const ACTIVE_MICROPHONE_ICON = new URL(
  "../../assets/figma/microphone-active.svg",
  import.meta.url,
).href;

export function initVoice() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  let activeRecognition = null;

  for (const button of document.querySelectorAll("[data-voice-target]")) {
    const input = document.getElementById(button.dataset.voiceTarget);
    if (!(input instanceof HTMLInputElement)) {
      throw new Error(`Input suara "${button.dataset.voiceTarget}" tidak ditemukan.`);
    }
    const microphoneIcon = button.querySelector(".field-icon");
    if (!(microphoneIcon instanceof HTMLImageElement)) {
      throw new Error(`Ikon mikrofon "${button.dataset.voiceTarget}" tidak ditemukan.`);
    }
    const idleMicrophoneIcon = microphoneIcon.getAttribute("src");
    if (!idleMicrophoneIcon) {
      throw new Error(`Sumber ikon mikrofon "${button.dataset.voiceTarget}" tidak valid.`);
    }

    if (!SpeechRecognition) {
      button.addEventListener("click", () => {
        showVoiceError("Browser ini belum mendukung fitur input suara.");
      });
      continue;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.interimResults = false;
    recognition.continuous = false;

    let isStarting = false;
    let isListening = false;

    function updateButtonState() {
      button.classList.toggle("is-recording", isListening);
      microphoneIcon.src = isListening
        ? ACTIVE_MICROPHONE_ICON
        : idleMicrophoneIcon;
      button.setAttribute("aria-pressed", String(isListening));
      button.setAttribute(
        "aria-label",
        isListening ? "Hentikan input suara" : button.title,
      );
    }

    recognition.addEventListener("start", () => {
      isStarting = false;
      isListening = true;
      updateButtonState();
    });

    recognition.addEventListener("result", (event) => {
      const transcripts = [];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          transcripts.push(result[0].transcript.trim());
        }
      }

      const transcript = transcripts.join(" ").trim();
      if (!transcript) {
        return;
      }

      const currentValue = input.value.trim();
      const separator = currentValue
        ? input.name === "resep"
          ? " "
          : ", "
        : "";
      input.value = `${currentValue}${separator}${transcript}`;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    recognition.addEventListener("error", (event) => {
      isStarting = false;
      isListening = false;
      if (activeRecognition === recognition) {
        activeRecognition = null;
      }
      updateButtonState();
      showVoiceError(getRecognitionErrorMessage(event.error));
    });

    recognition.addEventListener("end", () => {
      isStarting = false;
      isListening = false;
      if (activeRecognition === recognition) {
        activeRecognition = null;
      }
      updateButtonState();
    });

    button.addEventListener("click", () => {
      if (isListening) {
        recognition.stop();
        return;
      }
      if (isStarting) {
        return;
      }

      isStarting = true;
      if (activeRecognition && activeRecognition !== recognition) {
        activeRecognition.stop();
      }
      activeRecognition = recognition;
      try {
        recognition.start();
      } catch {
        isStarting = false;
        if (activeRecognition === recognition) {
          activeRecognition = null;
        }
        showVoiceError("Input suara tidak dapat dimulai. Silakan coba lagi.");
      }
    });
  }
}