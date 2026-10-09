export let selectedFilterTags = new Set();

export function initFilterLogic(onExecuteSearch) {
  const filterOverlay = document.getElementById('filterOverlay');
  const activeTagsContainer = document.getElementById('activeTagsContainer');
  const placeholderText = document.getElementById('filterPlaceholderText');
  const chipButtons = document.querySelectorAll('.chip-btn');
  const btnCloseFilter = document.getElementById('btnCloseFilter');
  const btnExecuteSearch = document.getElementById('btnExecuteSearch');
  const btnFilter = document.getElementById('btnFilter');
  const modalCariMenu = document.getElementById('modalCariMenu');

  function renderActiveFilterTags() {
    if (!activeTagsContainer) return;
    activeTagsContainer.innerHTML = '';

    if (placeholderText) {
      placeholderText.style.display = selectedFilterTags.size > 0 ? 'none' : 'inline';
    }

    activeTagsContainer.style.display = 'flex';
    activeTagsContainer.style.flexWrap = 'wrap';
    activeTagsContainer.style.gap = '8px';
    activeTagsContainer.style.alignItems = 'center';

    selectedFilterTags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag-active';
      tagEl.dataset.tag = tag;
      tagEl.textContent = tag;
      tagEl.addEventListener('click', () => {
        selectedFilterTags.delete(tag);
        updateChipState();
        renderActiveFilterTags();
      });
      activeTagsContainer.appendChild(tagEl);
    });

    updateChipState();
  }

  function updateChipState() {
    chipButtons.forEach(chip => {
      chip.classList.toggle('selected', selectedFilterTags.has(chip.dataset.tag));
    });
  }

  if (btnFilter) {
    btnFilter.addEventListener('click', () => {
      if (modalCariMenu) modalCariMenu.classList.add('hidden');
      filterOverlay.classList.toggle('hidden');
    });
  }

  if (btnCloseFilter) {
    btnCloseFilter.addEventListener('click', () => {
      filterOverlay.classList.add('hidden');
      if (onExecuteSearch) onExecuteSearch();
    });
  }

  if (btnExecuteSearch) {
    btnExecuteSearch.addEventListener('click', () => {
      filterOverlay.classList.add('hidden');
      if (onExecuteSearch) onExecuteSearch();
    });
  }

  chipButtons.forEach(chip => {
    chip.addEventListener('click', () => {
      const tagValue = chip.dataset.tag;
      if (selectedFilterTags.has(tagValue)) {
        selectedFilterTags.delete(tagValue);
      } else {
        selectedFilterTags.add(tagValue);
      }
      renderActiveFilterTags();
    });
  });

  renderActiveFilterTags();
}