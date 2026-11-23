const VIEWS = new Set(["saved", "profile"]);
const SCREENS = new Set(["steps", "cooking"]);
const PANELS = new Set(["password"]);
const KEYS = ["view", "recipe", "screen", "step", "panel"];

/** Baca state dari URL; nilai yang tidak valid diabaikan (jadi null). */
export function readViewState() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  const recipe = params.get("recipe");
  const screen = params.get("screen");
  const step = params.get("step");
  const panel = params.get("panel");

  const validView = VIEWS.has(view) ? view : null;
  const validRecipe = /^\d+$/.test(recipe ?? "") ? recipe : null;
  const validScreen = validRecipe && SCREENS.has(screen) ? screen : null;
  const validStep =
    validScreen === "cooking" && /^\d+$/.test(step ?? "") && Number(step) >= 1
      ? Number(step)
      : null;

  return {
    view: validView,
    recipe: validRecipe,
    screen: validScreen,
    step: validScreen === "cooking" ? (validStep ?? 1) : null,
    panel: validView === "profile" && PANELS.has(panel) ? panel : null,
  };
}

/**
 * Ubah sebagian state. Nilai null/undefined/"" menghapus parameter itu.
 * Parameter yang tidak masuk akal ikut dibersihkan:
 *   - tanpa recipe  -> screen & step dihapus
 *   - screen bukan "cooking" -> step dihapus
 *   - view bukan "profile"   -> panel dihapus
 */
export function updateViewState(patch) {
  try {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(patch)) {
      if (!KEYS.includes(key)) continue;
      if (value === null || value === undefined || value === "") {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, String(value));
      }
    }

    const params = url.searchParams;
    if (!params.has("recipe")) {
      params.delete("screen");
      params.delete("step");
    }
    if (params.get("screen") !== "cooking") params.delete("step");
    if (params.get("view") !== "profile") params.delete("panel");

    history.replaceState(null, "", url);
  } catch (error) {
    // History API bisa ditolak (mis. dibuka lewat file://). Tidak fatal.
    console.warn("Tidak dapat memperbarui URL tampilan:", error);
  }
}