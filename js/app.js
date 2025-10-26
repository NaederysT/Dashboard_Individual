/* Estado global (único lugar donde vive la información) */
const state = {
  // Más adelante: filas normalizadas de ventas (fecha, producto, etc.).
  rows: [],
  // KPIs vacíos por ahora; se actualizarán cuando existan datos.
  kpis: { revenue: 0, units: 0, tx: 0, atv: 0 },
};

/* Referencias a elementos de la UI (evita querySelector repetido) */
const els = {
  kpiRevenue: document.getElementById('kpiRevenue'),
  kpiUnits:   document.getElementById('kpiUnits'),
  kpiTx:      document.getElementById('kpiTx'),
  kpiATV:     document.getElementById('kpiATV'),
  btnLoadDefault: document.getElementById('btnLoadDefault'),
  fileInput:      document.getElementById('fileInput'),
};

/* Render mínimo de KPIs (aún sin datos) */
function renderKpis() {
  els.kpiRevenue.textContent = '—';
  els.kpiUnits.textContent   = '—';
  els.kpiTx.textContent      = '—';
  els.kpiATV.textContent     = '—';
}

/* Punto de entrada: establece el orden de inicialización */
function init() {
  renderKpis();
  console.info('Dashboard listo (prototipo inicial).');
}

init();
