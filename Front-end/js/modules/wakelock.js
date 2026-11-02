let wakeLock = null;
let shouldKeepAwake = false;

document.addEventListener("visibilitychange", () => {
  if (shouldKeepAwake && document.visibilityState === "visible") {
    void requestWakeLock();
  }
});

/**
 * Mengaktifkan penahan layar agar tidak mati/redup (Screen Wake Lock API)
 */
export async function requestWakeLock() {
  shouldKeepAwake = true;
  if (!("wakeLock" in navigator)) {
    console.warn("Screen Wake Lock API tidak didukung pada browser ini.");
    shouldKeepAwake = false;
    return;
  }
  if (
    document.visibilityState !== "visible" ||
    (wakeLock && !wakeLock.released)
  ) {
    return;
  }
  wakeLock = null;

  try {
    const lock = await navigator.wakeLock.request("screen");
    if (!shouldKeepAwake) {
      await lock.release();
      return;
    }

    wakeLock = lock;
    wakeLock.addEventListener("release", () => {
      if (wakeLock === lock) {
        wakeLock = null;
      }
    });
    console.log("Wake Lock aktif: layar akan terus menyala.");
  } catch (err) {
    console.error(`Gagal mengaktifkan Wake Lock: ${err.name}, ${err.message}`);
  }
}

/**
 * Melepas penahan layar sehingga kembali normal
 */
export async function releaseWakeLock() {
  shouldKeepAwake = false;
  const lock = wakeLock;
  wakeLock = null;
  if (!lock) {
    return;
  }

  try {
    await lock.release();
    console.log("Wake Lock berhasil dilepas.");
  } catch (err) {
    console.error(`Gagal melepas Wake Lock: ${err.name}, ${err.message}`);
  }
}