export const API_BASE_URL = "https://manajemen-proyek-josjis-4.vercel.app/api";

export const NETWORK_CONNECTION_ERROR_MESSAGE =
  "Tidak ada koneksi internet. Coba lagi saat terhubung.";

export function isNetworkConnectionError(error) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }
  const message = String(error?.message || "").toLocaleLowerCase("id");
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network error") ||
    message.includes("load failed")
  );
}