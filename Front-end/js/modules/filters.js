export function initFilters(onChange) {
  const filterButton = document.querySelector("#filter-button");
  const filterPanel = document.querySelector("#filter-panel");
  const closeButton = document.querySelector("#filter-close");
  const applyButton = document.querySelector("#filter-apply");
  const searchPanel = document.querySelector(".search-panel");

  if (
    !(filterButton instanceof HTMLButtonElement) ||
    !(filterPanel instanceof HTMLElement) ||
    !(closeButton instanceof HTMLButtonElement) ||
    !(applyButton instanceof HTMLButtonElement) ||
    !(searchPanel instanceof HTMLElement)
  ) {
    throw new Error("Elemen filter resep tidak ditemukan.");
  }

  function closeFilter() {
    filterPanel.setAttribute("aria-hidden", "true");
    filterPanel.inert = true;
    filterButton.setAttribute("aria-pressed", "false");
    filterButton.setAttribute("aria-expanded", "false");
    filterButton.classList.remove("is-selected");
    filterPanel.classList.remove("is-open");
  }

  function openFilter() {
    filterButton.setAttribute("aria-pressed", "true");
    filterButton.setAttribute("aria-expanded", "true");
    filterButton.classList.add("is-selected");
    filterPanel.setAttribute("aria-hidden", "false");
    filterPanel.inert = false;
    filterPanel.hidden = false;
    requestAnimationFrame(() => {
      if (filterButton.getAttribute("aria-expanded") === "true") {
        filterPanel.classList.add("is-open");
      }
    });
  }

  filterButton.addEventListener("click", () => {
    const isExpanded = filterButton.getAttribute("aria-expanded") === "true";
    if (isExpanded) {
      closeFilter();
      return;
    }

    openFilter();
  });

  closeButton.addEventListener("click", () => {
    closeFilter();
    filterButton.focus();
  });

  applyButton.addEventListener("click", () => {
    onChange();
    closeFilter();
    filterButton.focus();
  });

  document.addEventListener("click", (event) => {
    if (
      filterButton.getAttribute("aria-expanded") === "true" &&
      event.target instanceof Node &&
      !searchPanel.contains(event.target)
    ) {
      closeFilter();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      filterButton.getAttribute("aria-expanded") === "true"
    ) {
      closeFilter();
      filterButton.focus();
    }
  });

  return {
    getSelectedFilters() {
      return [...filterPanel.querySelectorAll('input[type="checkbox"]:checked')].map(
        (input) => input.value,
      );
    },
  };
}
