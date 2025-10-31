// /js/ui/render.js — Pinta KPIs, tablas top y oculta/mostrar card de categorías

import { fmtCurrency, fmtNumber } from "../core/formatters.js";

// Rellena tarjetas KPI con valores globales (revenue en USD, unidades y ventas)
export function renderKpis(kpis) {
  setText("kpiRevenue", fmtCurrency(kpis.revenue)); // USD
  setText("kpiUnits", fmtNumber(kpis.units));
  setText("kpiTx", fmtNumber(kpis.tx));
}

// Llena una tabla <tbody> con pares [nombre, valor] usando un formateador
export function fillTopTable(tableId, arr, valueFormatter) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const tbody =
    table.querySelector("tbody") ||
    table.appendChild(document.createElement("tbody")); // Asegura tbody
  tbody.innerHTML = ""; // Limpia filas previas

  const safeArr = Array.isArray(arr) ? arr : []; // Evita null/undefined

  for (const [name, value] of safeArr) {
    // Inserta filas
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${name ?? "-"}</td><td>${valueFormatter(value)}</td>`;
    tbody.appendChild(tr);
  }

  if (!safeArr.length) {
    // Fallback sin datos
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="2" style="color: var(--muted);">Sin datos para mostrar.</td>`;
    tbody.appendChild(tr);
  }
}

// Muestra u oculta la card de “Unidades por categoría” según exista la columna
export function showOrHideCategoryCard(visible) {
  const card = document
    .getElementById("chartCategoriesQty")
    ?.closest(".chart-card");
  if (!card) return;
  card.style.display = visible ? "" : "none";
}

// Helper: asigna texto a un elemento por id de forma segura
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
