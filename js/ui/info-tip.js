// /js/ui/info-tip.js
const BOX_ID = 'infoFilters';
const SHOW_BTN_ID = 'showFiltersHelp';

// Guarda visibilidad en localStorage (persistente entre sesiones)
const STORAGE_KEY = 'infoFiltersVisible'; // "1" visible, "0" oculto

function getStore(){ return localStorage; }

function setVisibility(isVisible) {
  const box = document.getElementById(BOX_ID);
  const btn = document.getElementById(SHOW_BTN_ID);
  if (!box || !btn) return;

  box.style.display = isVisible ? '' : 'none';
  btn.setAttribute('aria-pressed', isVisible ? 'true' : 'false');

  // Cambia etiqueta del botón
  const labelSpan =
    document.getElementById('filtersHelpBtnText') ||
    btn.querySelectorAll('span')[1]; // segundo span del botón
  if (labelSpan) {
    labelSpan.textContent = isVisible ? 'Ocultar ayuda de filtros' : 'Mostrar ayuda de filtros';
  }

  // Persiste estado
  const store = getStore();
  store.setItem(STORAGE_KEY, isVisible ? '1' : '0');
}

function initInfoTip(){
  const box = document.getElementById(BOX_ID);
  const btn = document.getElementById(SHOW_BTN_ID);
  if(!box || !btn) return;

  const store = getStore();
  const saved = store.getItem(STORAGE_KEY);

  // Por defecto visible si no hay preferencia guardada
  const initialVisible = saved === null ? true : saved === '1';
  setVisibility(initialVisible);

  // Toggle con el mismo botón
  btn.addEventListener('click', () => {
    const nowVisible = box.style.display === 'none' ? true : false;
    setVisibility(nowVisible);
  });
}

document.addEventListener('DOMContentLoaded', initInfoTip);
