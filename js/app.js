// /js/app.js (ESM) — Orquesta carga de CSV, estado global, filtros y render de gráficos/tablas

// Importa loaders de CSV (archivo por defecto y archivo local)
import { loadDefaultCsv, loadCsvFromFile } from "./data/loader.js";
// Convierte CSV a objetos con normalización de cabeceras
import { csvToObjects } from "./core/csv.js";
// Mapea nombres de columnas del CSV a claves internas
import { mapColumns } from "./core/columns.js";
// Normaliza filas y provee agregaciones y KPIs
import {
  normalizeRows,
  computeKpis,
  groupSum,
  sortTopN,
} from "./core/aggregations.js";
// Formateadores para monto (USD) y números
import { fmtCurrency, fmtNumber } from "./core/formatters.js";
// Render de KPIs, tablas y utilidades de UI
import {
  renderKpis,
  fillTopTable,
  showOrHideCategoryCard,
} from "./ui/render.js";
// Fábricas de charts y refresco visual por tema
import {
  destroyCharts,
  makeBarChart,
  makeLineChart,
  makeDoughnutChart,
  refreshChartTheme,
} from "./charts/makeCharts.js";
// Construcción de facetas, filtros, y límites dinámicos de fechas
import {
  buildFacets,
  filterRows,
  setOptions,
  readFormFilters,
  resetForm,
  getDateRange,
  dateRangeForFilters,
  applyDateLimits,
} from "./core/filters.js";

// Estado global del dashboard (columnas, filas, facetas y rango de fechas del dataset)
const STATE = {
  COLS: null,
  rows: [],
  facets: null,
  globalDateRange: null, // {min,max} en Date
};

// Procesa el CSV en texto: parsea, normaliza, facetea y dispara render inicial
function processCsvText(text) {
  const rawRows = csvToObjects(text); // Parse CSV a objetos
  if (!rawRows.length) {
    alert("El CSV está vacío o no tiene encabezados.");
    return;
  }

  STATE.COLS = mapColumns(rawRows[0]); // Detecta columnas relevantes
  STATE.rows = normalizeRows(rawRows, STATE.COLS); // Normaliza tipos y campos derivados
  STATE.facets = buildFacets(STATE.rows, STATE.COLS); // Arma listas únicas para selects
  STATE.globalDateRange = getDateRange(STATE.rows); // Calcula min/max de fechas del dataset

  const kpis = computeKpis(STATE.rows); // KPIs globales (USD)
  renderKpis(kpis); // Pinta tarjetas KPI

  setupFiltersUI(); // Poblado de selects y límites de fecha por formulario
  renderChartsAll(); // Render inicial de todos los gráficos
  renderSummaryTablesGlobal(); // Render de tablas resumen globales (sin filtros)
}

// Genera tablas “Top 5” globales (cantidad y ventas) sin depender de filtros
function renderSummaryTablesGlobal() {
  const mapQty = groupSum(
    STATE.rows,
    (r) => r.product,
    (r) => r.qty
  ); // Suma cantidad por producto
  const topQty = sortTopN(mapQty, 5); // Top 5 por cantidad
  fillTopTable("tableTopQty", topQty, fmtNumber); // Pinta tabla izquierda

  const mapRev = groupSum(
    STATE.rows,
    (r) => r.product,
    (r) => r.revenue
  ); // Suma ventas por producto
  const topRev = sortTopN(mapRev, 5); // Top 5 por ventas
  fillTopTable("tableTopRevenue", topRev, fmtCurrency); // Pinta tabla derecha (USD)
}

// Inicializa selects, límites de fechas y eventos de formularios de filtros
function setupFiltersUI() {
  // Carga opciones de categoría para gráficos de productos
  setOptions(
    document.querySelector('#filtersProductsQty select[name="category"]'),
    STATE.facets.categories,
    true,
    "Todas"
  );
  setOptions(
    document.querySelector('#filtersProductsRevenue select[name="category"]'),
    STATE.facets.categories,
    true,
    "Todas"
  );

  // Carga opciones de categoría y método de pago para gráfico temporal
  setOptions(
    document.querySelector('#filtersTime select[name="category"]'),
    STATE.facets.categories,
    true,
    "Todas"
  );
  setOptions(
    document.querySelector('#filtersTime select[name="pay"]'),
    STATE.facets.pays,
    true,
    "Todos"
  );

  // Carga opciones de categoría para gráfico de pagos
  setOptions(
    document.querySelector('#filtersPayments select[name="category"]'),
    STATE.facets.categories,
    true,
    "Todas"
  );

  // Carga opciones de categoría para gráfico geográfico
  setOptions(
    document.querySelector('#filtersGeo select[name="category"]'),
    STATE.facets.categories,
    true,
    "Todas"
  );

  // Aplica límites de fechas globales a todos los formularios
  const globalMinISO = STATE.globalDateRange.min
    ? iso(STATE.globalDateRange.min)
    : "";
  const globalMaxISO = STATE.globalDateRange.max
    ? iso(STATE.globalDateRange.max)
    : "";
  for (const fid of [
    "filtersProductsQty",
    "filtersProductsRevenue",
    "filtersTime",
    "filtersPayments",
    "filtersCategoriesQty",
    "filtersGeo",
  ]) {
    const form = document.getElementById(fid);
    if (form)
      applyDateLimits(form, { minISO: globalMinISO, maxISO: globalMaxISO }); // Setea min/max y corrige inputs fuera de rango
  }

  // Conecta acciones de aplicar/limpiar y recalcula límites cuando cambian dependencias
  wireForm("filtersProductsQty", renderProductsQty, ["category"]); // Productos por cantidad
  wireForm("filtersProductsRevenue", renderProductsRevenue, ["category"]); // Productos por ventas
  wireForm("filtersTime", renderTime, ["category", "pay"]); // Línea temporal
  wireForm("filtersPayments", renderPayments, ["category"]); // Donut de pagos
  wireForm("filtersCategoriesQty", renderCategoriesQty, []); // Categorías por unidades
  wireForm("filtersGeo", renderGeo, ["category"]); // Geográfico

  // Re-render del gráfico temporal al cambiar granularidad (mes/trimestre)
  document
    .querySelector('#filtersTime [name="gran"]')
    ?.addEventListener("change", renderTime);
}

// Convierte Date a yyyy-mm-dd para inputs tipo date
function iso(d) {
  const y = d.getFullYear(),
    m = String(d.getMonth() + 1).padStart(2, "0"),
    dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// Enlaza eventos de un formulario de filtros y recalcula límites dinámicos de fechas
function wireForm(formId, renderFn, deps = []) {
  const form = document.getElementById(formId);
  if (!form) return;

  form
    .querySelector('[data-action="apply"]')
    ?.addEventListener("click", renderFn); // Botón aplicar vuelve a pintar
  form.querySelector('[data-action="reset"]')?.addEventListener("click", () => {
    resetForm(form); // Limpia selects y fechas
    const minISO = STATE.globalDateRange.min
      ? iso(STATE.globalDateRange.min)
      : ""; // Restaura min global
    const maxISO = STATE.globalDateRange.max
      ? iso(STATE.globalDateRange.max)
      : ""; // Restaura max global
    applyDateLimits(form, { minISO, maxISO }); // Reaplica límites
    renderFn(); // Re-render con estado limpio
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    renderFn();
  }); // Previene submit nativo

  const recalc = () => {
    // Recalcula min/max por subset
    const f = readFormFilters(form); // Lee category/pay/from/to
    const { minISO, maxISO } = dateRangeForFilters(
      STATE.rows,
      { ...f, from: null, to: null },
      STATE.COLS
    ); // Rango válido por subset
    const min =
      minISO ||
      (STATE.globalDateRange.min ? iso(STATE.globalDateRange.min) : ""); // Fallback global
    const max =
      maxISO ||
      (STATE.globalDateRange.max ? iso(STATE.globalDateRange.max) : ""); // Fallback global
    applyDateLimits(form, { minISO: min, maxISO: max }); // Aplica límites al form
  };

  for (const name of deps) {
    const el = form.querySelector(`[name="${name}"]`); // Observa dependencias
    if (el) el.addEventListener("change", recalc); // Recalcula al cambiar
  }

  recalc(); // Ajuste inicial de límites
}

// Pinta gráfico “Top 5 productos por cantidad” considerando filtros del formulario
function renderProductsQty() {
  const f = readFormFilters(document.getElementById("filtersProductsQty")); // Lee filtros locales
  const rowsF = filterRows(STATE.rows, f, STATE.COLS); // Filtra dataset
  const topQty = sortTopN(
    groupSum(
      rowsF,
      (r) => r.product,
      (r) => r.qty
    ),
    5
  ); // Top 5 por cantidad

  makeBarChart(
    document.getElementById("chartProductsQty").getContext("2d"),
    topQty.map(([k]) => k), // Etiquetas
    topQty.map(([, v]) => v), // Valores
    {
      label: "Cantidad",
      valueFmt: fmtNumber,
      maxLabelLen: 18,
      key: "productsQty",
      showLegend: false,
    } // Config chart
  );
}

// Pinta gráfico “Top 5 productos por ventas” considerando filtros del formulario
function renderProductsRevenue() {
  const f = readFormFilters(document.getElementById("filtersProductsRevenue")); // Lee filtros locales
  const rowsF = filterRows(STATE.rows, f, STATE.COLS); // Filtra dataset
  const topRevenue = sortTopN(
    groupSum(
      rowsF,
      (r) => r.product,
      (r) => r.revenue
    ),
    5
  ); // Top 5 por ventas

  makeBarChart(
    document.getElementById("chartProductsRevenue").getContext("2d"),
    topRevenue.map(([k]) => k), // Etiquetas
    topRevenue.map(([, v]) => v), // Valores
    {
      label: "Ventas (USD)",
      valueFmt: fmtCurrency,
      maxLabelLen: 18,
      key: "productsRevenue",
      showLegend: false,
    } // Config chart
  );
}

// Pinta gráfico de línea temporal agrupando por mes o trimestre con filtros aplicados
function renderTime() {
  const form = document.getElementById("filtersTime"); // Form del gráfico temporal
  const f = readFormFilters(form); // Lee filtros locales
  const gran = form?.querySelector('[name="gran"]')?.value || "month"; // Lee granularidad

  const rowsF = filterRows(STATE.rows, f, STATE.COLS); // Filtra dataset

  const keyFn = (r) => {
    // Define clave de agrupación
    if (!r.date || isNaN(r.date)) return "N/A"; // Descarta fechas inválidas
    if (gran === "quarter") {
      // Agrupa en YYYY-Qn
      const q = Math.floor(r.date.getMonth() / 3) + 1;
      return `${r.date.getFullYear()}-Q${q}`;
    }
    return r.ym; // Mes: YYYY-MM ya precalculado
  };

  const byPeriod = groupSum(
    rowsF.filter((r) => keyFn(r) !== "N/A"),
    keyFn,
    (r) => r.revenue
  ); // Suma ventas por periodo
  const labels = Array.from(byPeriod.keys()).sort(); // Orden cronológico
  const data = labels.map((p) => byPeriod.get(p)); // Serie de datos

  makeLineChart(
    document.getElementById("chartTime").getContext("2d"),
    labels,
    data,
    "Ventas (USD)", // Etiqueta de serie
    {
      valueFmt: fmtCurrency,
      maxLabelLen: gran === "quarter" ? 8 : 7,
      key: "time",
      showLegend: false,
    } // Config chart
  );
}

// Pinta gráfico de dona con distribución de métodos de pago
function renderPayments() {
  const f = readFormFilters(document.getElementById("filtersPayments")); // Lee filtros locales
  const rowsF = filterRows(STATE.rows, f, STATE.COLS); // Filtra dataset

  const byPay = groupSum(
    rowsF,
    (r) => r.pay || "Desconocido",
    (_) => 1
  ); // Cuenta transacciones por método
  const labels = Array.from(byPay.keys()); // Etiquetas de métodos
  const data = labels.map((k) => byPay.get(k)); // Totales por método

  makeDoughnutChart(
    document.getElementById("chartPayments").getContext("2d"),
    labels,
    data,
    "Métodos de pago",
    { key: "payments", showLegend: true } // Config chart
  );
}

// Pinta gráfico de barras de unidades por categoría (solo rango de fechas)
function renderCategoriesQty() {
  const card = document
    .getElementById("chartCategoriesQty")
    ?.closest(".chart-card"); // Card contenedora
  if (!card) return;

  const hasCategory = Boolean(STATE.COLS.category); // Verifica existencia de columna
  showOrHideCategoryCard(hasCategory); // Oculta card si no hay categoría
  if (!hasCategory) return;

  const f = readFormFilters(document.getElementById("filtersCategoriesQty")); // Lee fechas
  const rowsF = filterRows(STATE.rows, f, STATE.COLS); // Filtra dataset

  const byCat = groupSum(
    rowsF,
    (r) => r.category || "Sin categoría",
    (r) => r.qty
  ); // Suma unidades por categoría
  const top = sortTopN(byCat, 15); // Top 15 categorías

  makeBarChart(
    document.getElementById("chartCategoriesQty").getContext("2d"),
    top.map(([k]) => k), // Etiquetas
    top.map(([, v]) => v), // Valores
    {
      label: "Unidades",
      valueFmt: fmtNumber,
      maxLabelLen: 16,
      key: "categoriesQty",
      showLegend: false,
    } // Config chart
  );
}

// Pinta gráfico geográfico por región/país sumando ventas
function renderGeo() {
  const f = readFormFilters(document.getElementById("filtersGeo")); // Lee filtros locales
  const rowsF = filterRows(STATE.rows, f, STATE.COLS); // Filtra dataset

  const geoKey = rowsF.some((r) => r.region && r.region.trim() !== "")
    ? "region"
    : "country"; // Decide nivel geográfico
  const byGeo = groupSum(
    rowsF,
    (r) => r[geoKey] || "Desconocido",
    (r) => r.revenue
  ); // Suma ventas por región/país
  const top = sortTopN(byGeo, 20); // Top 20 lugares

  makeBarChart(
    document.getElementById("chartGeo").getContext("2d"),
    top.map(([k]) => k), // Etiquetas
    top.map(([, v]) => v), // Valores
    {
      label: `Ventas por ${geoKey === "region" ? "región" : "país"} (USD)`,
      valueFmt: fmtCurrency,
      maxLabelLen: 14,
      key: "geo",
      showLegend: false,
    } // Config chart
  );
}

// Renderiza todos los gráficos desde cero y refresca tema visual
function renderChartsAll() {
  destroyCharts(); // Limpia instancias previas
  renderProductsQty(); // Barras: cantidad
  renderProductsRevenue(); // Barras: ventas (USD)
  renderTime(); // Línea: temporal
  renderPayments(); // Dona: métodos de pago
  renderCategoriesQty(); // Barras: unidades por categoría
  renderGeo(); // Barras: geográfico
  try {
    refreshChartTheme();
  } catch {} // Ajusta colores si cambió el tema
}

// Botón: carga CSV por defecto y procesa
document
  .getElementById("btnLoadDefault")
  ?.addEventListener("click", async () => {
    try {
      const text = await loadDefaultCsv();
      processCsvText(text);
    } catch (e) {
      console.error(e);
      alert(e.message || "No se pudo cargar el CSV por defecto.");
    }
  });

// Input: carga CSV local y procesa
document.getElementById("fileInput")?.addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  try {
    const text = await loadCsvFromFile(f);
    processCsvText(text);
  } catch (e) {
    console.error(e);
    alert(e.message || "No se pudo leer el archivo.");
  }
});

// Autoload opcional al abrir (usa el CSV por defecto)
(async () => {
  const t = await loadDefaultCsv();
  processCsvText(t);
})();
