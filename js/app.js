// /js/app.js  (ESM)
import { loadDefaultCsv, loadCsvFromFile } from './data/loader.js';
import { csvToObjects } from './core/csv.js';
import { mapColumns } from './core/columns.js';
import { normalizeRows, computeKpis, groupSum, sortTopN } from './core/aggregations.js';
import { fmtCurrency, fmtNumber } from './core/formatters.js';
import { renderKpis, fillTopTable, showOrHideCategoryCard } from './ui/render.js';
import { destroyCharts, makeBarChart, makeLineChart, makeDoughnutChart, refreshChartTheme } from './charts/makeCharts.js';
import { buildFacets, filterRows, setOptions, readFormFilters, resetForm, getDateRange, dateRangeForFilters, applyDateLimits } from './core/filters.js';

const STATE = {
  COLS: null,
  rows: [],
  facets: null,
  globalDateRange: null, // {min, max} en Date
};

// ================== Carga y preparación ==================
function processCsvText(text) {
  const rawRows = csvToObjects(text);
  if (!rawRows.length) { alert('El CSV está vacío o no tiene encabezados.'); return; }

  STATE.COLS = mapColumns(rawRows[0]);
  STATE.rows = normalizeRows(rawRows, STATE.COLS);
  STATE.facets = buildFacets(STATE.rows, STATE.COLS);
  STATE.globalDateRange = getDateRange(STATE.rows); // rango total del dataset

  // KPIs globales (sin filtros) => USD
  const kpis = computeKpis(STATE.rows);
  renderKpis(kpis);

  // Poblamos selects y límites de fechas de cada formulario
  setupFiltersUI();

  // Render inicial de gráficos
  renderChartsAll();

  // Resumen tabular GLOBAL (USD)
  renderSummaryTablesGlobal();
}

// =============== Resumen tabular global (siempre el mismo) ===============
function renderSummaryTablesGlobal() {
  const mapQty = groupSum(STATE.rows, r => r.product, r => r.qty);
  const topQty = sortTopN(mapQty, 5);
  fillTopTable('tableTopQty', topQty, fmtNumber);

  const mapRev = groupSum(STATE.rows, r => r.product, r => r.revenue);
  const topRev = sortTopN(mapRev, 5);
  fillTopTable('tableTopRevenue', topRev, fmtCurrency); // USD
}

// ================== UI Filtros ==================
function setupFiltersUI(){
  // Productos (qty / revenue)
  setOptions(document.querySelector('#filtersProductsQty select[name="category"]'), STATE.facets.categories, true, 'Todas');
  setOptions(document.querySelector('#filtersProductsRevenue select[name="category"]'), STATE.facets.categories, true, 'Todas');

  // Time — categoría + pago (granularidad viene fija en HTML)
  setOptions(document.querySelector('#filtersTime select[name="category"]'), STATE.facets.categories, true, 'Todas');
  setOptions(document.querySelector('#filtersTime select[name="pay"]'), STATE.facets.pays, true, 'Todos');

  // Payments
  setOptions(document.querySelector('#filtersPayments select[name="category"]'), STATE.facets.categories, true, 'Todas');

  // Geo
  setOptions(document.querySelector('#filtersGeo select[name="category"]'), STATE.facets.categories, true, 'Todas');

  // Límites de fechas (globales) por defecto
  const globalMinISO = STATE.globalDateRange.min ? iso(STATE.globalDateRange.min) : '';
  const globalMaxISO = STATE.globalDateRange.max ? iso(STATE.globalDateRange.max) : '';
  for (const fid of [
    'filtersProductsQty','filtersProductsRevenue','filtersTime',
    'filtersPayments','filtersCategoriesQty','filtersGeo'
  ]) {
    const form = document.getElementById(fid);
    if (form) applyDateLimits(form, { minISO: globalMinISO, maxISO: globalMaxISO });
  }

  // Wire de botones + recalculo de límites
  wireForm('filtersProductsQty', renderProductsQty, ['category']);
  wireForm('filtersProductsRevenue', renderProductsRevenue, ['category']);
  wireForm('filtersTime', renderTime, ['category','pay']);
  wireForm('filtersPayments', renderPayments, ['category']);
  wireForm('filtersCategoriesQty', renderCategoriesQty, []); // solo fechas
  wireForm('filtersGeo', renderGeo, ['category']);

  // 🔽 Además, el cambio de granularidad re-renderiza el gráfico (no afecta límites)
  document
    .querySelector('#filtersTime [name="gran"]')
    ?.addEventListener('change', renderTime);
}

function iso(d){
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

// Escucha cambios en dependencias (category/pay) para recalcular límites min/max de fechas del form
function wireForm(formId, renderFn, deps = []){
  const form = document.getElementById(formId);
  if (!form) return;

  // Botones aplicar/limpiar
  form.querySelector('[data-action="apply"]')?.addEventListener('click', renderFn);
  form.querySelector('[data-action="reset"]')?.addEventListener('click', ()=>{
    resetForm(form);
    // tras reset, volvemos a límites globales
    const minISO = STATE.globalDateRange.min ? iso(STATE.globalDateRange.min) : '';
    const maxISO = STATE.globalDateRange.max ? iso(STATE.globalDateRange.max) : '';
    applyDateLimits(form, { minISO, maxISO });
    renderFn();
  });
  form.addEventListener('submit', (e)=>{ e.preventDefault(); renderFn(); });

  // Dependencias: si cambian (category/pay), recalculamos el rango válido para ese subconjunto
  const recalc = ()=>{
    const f = readFormFilters(form);
    // ignorar from/to (rango) para calcular límites por subset:
    const { minISO, maxISO } = dateRangeForFilters(STATE.rows, { ...f, from:null, to:null }, STATE.COLS);
    // si no hay data para ese subset, caemos al global; si hay, aplicamos el subset
    const min = minISO || (STATE.globalDateRange.min ? iso(STATE.globalDateRange.min) : '');
    const max = maxISO || (STATE.globalDateRange.max ? iso(STATE.globalDateRange.max) : '');
    applyDateLimits(form, { minISO: min, maxISO: max });
  };

  for (const name of deps){
    const el = form.querySelector(`[name="${name}"]`);
    if (el) el.addEventListener('change', recalc);
  }

  // inicial
  recalc();
}

// ================== Render por gráfico ==================
function renderProductsQty(){
  const f = readFormFilters(document.getElementById('filtersProductsQty'));
  const rowsF = filterRows(STATE.rows, f, STATE.COLS);
  const topQty = sortTopN(groupSum(rowsF, r=>r.product, r=>r.qty), 5);

  makeBarChart(
    document.getElementById('chartProductsQty').getContext('2d'),
    topQty.map(([k])=>k),
    topQty.map(([,v])=>v),
    { label: 'Cantidad', valueFmt: fmtNumber, maxLabelLen: 18, key: 'productsQty', showLegend: false }
  );
}

function renderProductsRevenue(){
  const f = readFormFilters(document.getElementById('filtersProductsRevenue'));
  const rowsF = filterRows(STATE.rows, f, STATE.COLS);
  const topRevenue = sortTopN(groupSum(rowsF, r=>r.product, r=>r.revenue), 5);

  makeBarChart(
    document.getElementById('chartProductsRevenue').getContext('2d'),
    topRevenue.map(([k])=>k),
    topRevenue.map(([,v])=>v),
    { label: 'Ventas (USD)', valueFmt: fmtCurrency, maxLabelLen: 18, key: 'productsRevenue', showLegend: false }
  );
}

function renderTime(){
  const form = document.getElementById('filtersTime');
  const f = readFormFilters(form);
  const gran = form?.querySelector('[name="gran"]')?.value || 'month'; // 'month' | 'quarter'

  const rowsF = filterRows(STATE.rows, f, STATE.COLS);

  // Agrupación por periodo según granularidad
  const keyFn = (r) => {
    if (!r.date || isNaN(r.date)) return 'N/A';
    if (gran === 'quarter') {
      const q = Math.floor(r.date.getMonth() / 3) + 1; // 1..4
      return `${r.date.getFullYear()}-Q${q}`;
    }
    // month (default)
    return r.ym; // YYYY-MM (ya calculado en normalizeRows)
  };

  const byPeriod = groupSum(rowsF.filter(r=>keyFn(r)!=='N/A'), keyFn, r=>r.revenue);
  const labels = Array.from(byPeriod.keys()).sort(); // YYYY-MM o YYYY-Qn
  const data   = labels.map(p=>byPeriod.get(p));

  makeLineChart(
    document.getElementById('chartTime').getContext('2d'),
    labels,
    data,
    'Ventas (USD)',
    { valueFmt: fmtCurrency, maxLabelLen: gran === 'quarter' ? 8 : 7, key: 'time', showLegend: false }
  );
}

function renderPayments(){
  const f = readFormFilters(document.getElementById('filtersPayments'));
  const rowsF = filterRows(STATE.rows, f, STATE.COLS);

  const byPay = groupSum(rowsF, r=>r.pay || 'Desconocido', _=>1);
  const labels = Array.from(byPay.keys());
  const data   = labels.map(k=>byPay.get(k));

  makeDoughnutChart(
    document.getElementById('chartPayments').getContext('2d'),
    labels, data, 'Métodos de pago', { key:'payments', showLegend:true }
  );
}

function renderCategoriesQty(){
  const card = document.getElementById('chartCategoriesQty')?.closest('.chart-card');
  if (!card) return;

  const hasCategory = Boolean(STATE.COLS.category);
  showOrHideCategoryCard(hasCategory);
  if (!hasCategory) return;

  const f = readFormFilters(document.getElementById('filtersCategoriesQty'));
  const rowsF = filterRows(STATE.rows, f, STATE.COLS);

  const byCat = groupSum(rowsF, r=>r.category || 'Sin categoría', r=>r.qty);
  const top   = sortTopN(byCat, 15);

  makeBarChart(
    document.getElementById('chartCategoriesQty').getContext('2d'),
    top.map(([k])=>k),
    top.map(([,v])=>v),
    { label: 'Unidades', valueFmt: fmtNumber, maxLabelLen: 16, key: 'categoriesQty', showLegend:false }
  );
}

function renderGeo(){
  const f = readFormFilters(document.getElementById('filtersGeo'));
  const rowsF = filterRows(STATE.rows, f, STATE.COLS);

  const geoKey = rowsF.some(r=>r.region && r.region.trim()!=='') ? 'region' : 'country';
  const byGeo = groupSum(rowsF, r=>r[geoKey] || 'Desconocido', r=>r.revenue);
  const top   = sortTopN(byGeo, 20);

  makeBarChart(
    document.getElementById('chartGeo').getContext('2d'),
    top.map(([k])=>k),
    top.map(([,v])=>v),
    { label: `Ventas por ${geoKey === 'region' ? 'región' : 'país'} (USD)`, valueFmt: fmtCurrency, maxLabelLen: 14, key: 'geo', showLegend:false }
  );
}

// Render inicial de todos
function renderChartsAll(){
  destroyCharts();
  renderProductsQty();
  renderProductsRevenue();
  renderTime();
  renderPayments();
  renderCategoriesQty();
  renderGeo();
  try{ refreshChartTheme(); }catch{}
}

// ================== Eventos UI ==================
document.getElementById('btnLoadDefault')?.addEventListener('click', async () => {
  try { const text = await loadDefaultCsv(); processCsvText(text); }
  catch (e) { console.error(e); alert(e.message || 'No se pudo cargar el CSV por defecto.'); }
});
document.getElementById('fileInput')?.addEventListener('change', async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  try { const text = await loadCsvFromFile(f); processCsvText(text); }
  catch (e) { console.error(e); alert(e.message || 'No se pudo leer el archivo.'); }
});

// Autoload opcional
(async () => { const t = await loadDefaultCsv(); processCsvText(t); })();
