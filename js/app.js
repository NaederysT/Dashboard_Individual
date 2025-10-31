// /js/app.js  (ESM)
import { loadDefaultCsv, loadCsvFromFile } from './data/loader.js';
import { csvToObjects } from './core/csv.js';
import { mapColumns } from './core/columns.js';
import { normalizeRows, computeKpis, groupSum, sortTopN } from './core/aggregations.js';
import { fmtCurrency, fmtNumber } from './core/formatters.js';
import { renderKpis, fillTopTable, showOrHideCategoryCard } from './ui/render.js';
import { destroyCharts, makeBarChart, makeLineChart, makeDoughnutChart } from './charts/makeCharts.js';

function processCsvText(text) {
  const rawRows = csvToObjects(text);
  if (!rawRows.length) { alert('El CSV está vacío o no tiene encabezados.'); return; }

  const COLS = mapColumns(rawRows[0]);          // 1) columnas
  const rows = normalizeRows(rawRows, COLS);    // 2) normalizar

  // 3) KPIs y agregaciones
  const kpis = computeKpis(rows);

  // Top 5 (no 10)
  const topQty     = sortTopN(groupSum(rows, (r) => r.product, (r) => r.qty), 5);
  const topRevenue = sortTopN(groupSum(rows, (r) => r.product, (r) => r.revenue), 5);

  const byMonth      = groupSum(rows.filter(r => r.ym !== 'N/A'), (r) => r.ym, (r) => r.revenue);
  const monthsSorted = Array.from(byMonth.keys()).sort();
  const monthValues  = monthsSorted.map((m) => byMonth.get(m));

  const byPay      = groupSum(rows, (r) => r.pay || 'Desconocido', (_) => 1);
  const payLabels  = Array.from(byPay.keys());
  const payData    = payLabels.map((k) => byPay.get(k));

  const geoKey     = rows.some((r) => r.region && r.region.trim() !== '') ? 'region' : 'country';
  const byGeo      = groupSum(rows, (r) => r[geoKey] || 'Desconocido', (r) => r.revenue);
  const geoTop     = sortTopN(byGeo, 20);
  const geoLabels  = geoTop.map(([k]) => k);
  const geoData    = geoTop.map(([, v]) => v);

  // Categorías (si existe columna)
  let categoriesTop = [];
  if (COLS.category) {
    const byCat = groupSum(rows, (r) => r.category || 'Sin categoría', (r) => r.qty);
    categoriesTop = sortTopN(byCat, 15);
  }

  // 4) Pintar UI
  renderKpis(kpis);

  destroyCharts();

  // Barras (sin leyenda)
  makeBarChart(
    document.getElementById('chartProductsQty').getContext('2d'),
    topQty.map(([k]) => k),
    topQty.map(([, v]) => v),
    { label: 'Cantidad', valueFmt: fmtNumber, maxLabelLen: 18, key: 'productsQty', showLegend: false }
  );

  makeBarChart(
    document.getElementById('chartProductsRevenue').getContext('2d'),
    topRevenue.map(([k]) => k),
    topRevenue.map(([, v]) => v),
    { label: 'Ventas', valueFmt: fmtCurrency, maxLabelLen: 18, key: 'productsRevenue', showLegend: false }
  );

  // Línea (sin leyenda)
  makeLineChart(
    document.getElementById('chartTime').getContext('2d'),
    monthsSorted,
    monthValues,
    'Ventas',
    { valueFmt: fmtCurrency, maxLabelLen: 7, key: 'time', showLegend: false }
  );

  // Doughnut (con leyenda)
  makeDoughnutChart(
    document.getElementById('chartPayments').getContext('2d'),
    payLabels,
    payData,
    'Métodos de pago',
    { key: 'payments', showLegend: true }
  );

  // Barras geo (sin leyenda)
  makeBarChart(
    document.getElementById('chartGeo').getContext('2d'),
    geoLabels,
    geoData,
    { label: `Ventas por ${geoKey === 'region' ? 'región' : 'país'}`, valueFmt: fmtCurrency, maxLabelLen: 14, key: 'geo', showLegend: false }
  );

  // Categorías (si existe, sin leyenda)
  showOrHideCategoryCard(Boolean(COLS.category));
  if (COLS.category && categoriesTop.length) {
    makeBarChart(
      document.getElementById('chartCategoriesQty').getContext('2d'),
      categoriesTop.map(([k]) => k),
      categoriesTop.map(([, v]) => v),
      { label: 'Unidades', valueFmt: fmtNumber, maxLabelLen: 16, key: 'categoriesQty', showLegend: false }
    );
  }

  // Tablas
  fillTopTable('tableTopQty',     topQty,     fmtNumber);
  fillTopTable('tableTopRevenue', topRevenue, fmtCurrency);
}

/* Eventos UI */
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

// // Autoload opcional:
// // (async () => { const t = await loadDefaultCsv(); processCsvText(t); })();
