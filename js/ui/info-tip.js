// /js/ui/info-tip.js — Controla visibilidad del recuadro de ayuda y persiste el estado

// IDs de elementos: caja de ayuda y botón de mostrar/ocultar
const BOX_ID = "infoFilters";
const SHOW_BTN_ID = "showFiltersHelp";

// Clave de almacenamiento para recordar visibilidad entre sesiones
const STORAGE_KEY = "infoFiltersVisible"; // "1" visible, "0" oculto

// Selecciona el storage a usar (localStorage para persistir)
function getStore() {
  return localStorage;
}

// Aplica visibilidad a la caja, actualiza estado ARIA y texto del botón, y persiste
function setVisibility(isVisible) {
  const box = document.getElementById(BOX_ID);
  const btn = document.getElementById(SHOW_BTN_ID);
  if (!box || !btn) return;

  box.style.display = isVisible ? "" : "none"; // Muestra/oculta la caja
  btn.setAttribute("aria-pressed", isVisible ? "true" : "false"); // Actualiza atributo ARIA

  const labelSpan =
    document.getElementById("filtersHelpBtnText") ||
    btn.querySelectorAll("span")[1]; // Obtiene el span de texto del botón
  if (labelSpan) {
    labelSpan.textContent = isVisible
      ? "Ocultar ayuda de filtros"
      : "Mostrar ayuda de filtros"; // Cambia etiqueta según estado
  }

  const store = getStore();
  store.setItem(STORAGE_KEY, isVisible ? "1" : "0"); // Guarda preferencia en storage
}

// Inicializa estado: lee preferencia, setea visibilidad y enlaza el toggle del botón
function initInfoTip() {
  const box = document.getElementById(BOX_ID);
  const btn = document.getElementById(SHOW_BTN_ID);
  if (!box || !btn) return;

  const store = getStore();
  const saved = store.getItem(STORAGE_KEY);

  const initialVisible = saved === null ? true : saved === "1"; // Por defecto visible si no hay preferencia
  setVisibility(initialVisible); // Aplica estado inicial

  btn.addEventListener("click", () => {
    // Alterna visibilidad al hacer click
    const nowVisible = box.style.display === "none" ? true : false;
    setVisibility(nowVisible);
  });
}

// Activa inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", initInfoTip);
