let wakeLock = null;

/**
 * Mengaktifkan penahan layar agar tidak mati/redup (Screen Wake Lock API)
 */
export async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock aktif: layar akan terus menyala.');

      // Event listener jika wake lock dilepas otomatis oleh sistem (misal pindah tab / minimize)
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock telah dilepas oleh sistem.');
        wakeLock = null;
      });
    } catch (err) {
      console.error(`Gagal mengaktifkan Wake Lock: ${err.name}, ${err.message}`);
    }
  } else {
    console.warn('Screen Wake Lock API tidak didukung pada browser ini.');
  }
}

/**
 * Melepas penahan layar sehingga kembali normal
 */
export async function releaseWakeLock() {
  if (wakeLock !== null) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log('Wake Lock berhasil dilepas.');
    } catch (err) {
      console.error(`Gagal melepas Wake Lock: ${err.name}, ${err.message}`);
    }
  }
}