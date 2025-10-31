// /js/ui/render.js
export function renderKpis(kpis) {
  setText('kpiRevenue', formatCurrency(kpis.revenue));
  setText('kpiUnits',   formatNumber(kpis.units));
  setText('kpiTx',      formatNumber(kpis.tx));
  // kpiATV eliminado (ticket promedio)
}

export function fillTopTable(tableId, arr, valueFormatter) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = '';
  for (const [name, value] of arr) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${name}</td><td>${valueFormatter(value)}</td>`;
    tbody.appendChild(tr);
  }
}

export function showOrHideCategoryCard(visible) {
  const card = document.getElementById('chartCategoriesQty')?.closest('.chart-card');
  if (!card) return;
  card.style.display = visible ? '' : 'none';
}

/* helpers locales */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function formatCurrency(n, symbol = '$') {
  return symbol + Number(n || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 });
}
function formatNumber(n) {
  return Number(n || 0).toLocaleString('es-CL');
}
