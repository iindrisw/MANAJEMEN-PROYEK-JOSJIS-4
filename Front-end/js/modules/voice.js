import { showCustomModal } from './ui.js';

export function initVoiceRecognition(btnMic, targetInput) {
  if (!btnMic || !targetInput) return;

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    btnMic.addEventListener('click', () => {
      showCustomModal('Fitur Voice Input tidak didukung oleh browser ini.', 'Perangkat Tidak Mendukung');
    });
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = 'id-ID';
  recognition.continuous = false;
  recognition.interimResults = false;

  let isListening = false;

  btnMic.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
      return;
    }

    try {
      recognition.start();
    } catch (err) {
      console.error('Error voice recognition:', err);
      recognition.stop();
    }
  });

  recognition.onstart = () => {
    isListening = true;
    btnMic.style.color = '#3b82f6'; // Biru saat aktif
  };

  recognition.onend = () => {
    isListening = false;
    btnMic.style.color = '#6b7280'; // Abu-abu saat inaktif
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    targetInput.value = targetInput.value ? `${targetInput.value}, ${transcript}` : transcript;
    targetInput.dispatchEvent(new Event('input'));
  };

  recognition.onerror = (event) => {
    isListening = false;
    btnMic.style.color = '#6b7280';

    if (event.error === 'not-allowed') {
      showCustomModal('Akses mikrofon ditolak. Silakan izinkan melalui pengaturan browser Anda.', 'Akses Ditolak');
    }
  };
}