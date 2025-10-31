// /js/ui/render.js
import { fmtCurrency, fmtNumber } from '../core/formatters.js';

export function renderKpis(kpis) {
  setText('kpiRevenue', fmtCurrency(kpis.revenue)); // USD
  setText('kpiUnits',   fmtNumber(kpis.units));
  setText('kpiTx',      fmtNumber(kpis.tx));
}

export function fillTopTable(tableId, arr, valueFormatter) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const tbody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
  tbody.innerHTML = '';

  const safeArr = Array.isArray(arr) ? arr : [];

  for (const [name, value] of safeArr) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${name ?? '-'}</td><td>${valueFormatter(value)}</td>`;
    tbody.appendChild(tr);
  }

  if (!safeArr.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="2" style="color: var(--muted);">Sin datos para mostrar.</td>`;
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
