// /js/core/aggregations.js — Normaliza filas, agrega por clave, ordena top-N y calcula KPIs

// Convierte strings numéricos con puntos/commas a Number seguro (0 si inválido)
function parseNumber(v) {
  if (v === null || v === undefined) return 0;
  let s = String(v).trim();
  const hasComma = s.includes(","),
    hasDot = s.includes(".");
  if (hasComma && hasDot)
    s = s.replace(/\./g, "").replace(",", "."); // "1.234,56" → "1234.56"
  else if (hasComma && !hasDot) s = s.replace(",", "."); // "1234,56"  → "1234.56"
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// Intenta parsear fecha en ISO "YYYY-MM-DD", "DD/MM/YYYY" o Date-compatible; null si no puede
function parseDateSmart(v) {
  const s = String(v || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("/").map((x) => parseInt(x, 10));
    return new Date(yyyy, mm - 1, dd);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// Devuelve filas normalizadas: tipos coherentes, revenue derivado si falta, y campo ym (YYYY-MM)
export function normalizeRows(rows, COLS) {
  return rows.map((r) => {
    const d = parseDateSmart(r[COLS.date]);
    const year = d ? d.getFullYear() : null;
    const month = d ? d.getMonth() + 1 : null;

    const qty = parseNumber(r[COLS.qty]);
    const unit = COLS.unit ? parseNumber(r[COLS.unit]) : null;
    const revenue = COLS.revenue
      ? parseNumber(r[COLS.revenue])
      : unit !== null
      ? unit * qty
      : 0;

    return {
      product: r[COLS.product], // Nombre del producto
      category: COLS.category ? r[COLS.category] : null, // Categoría (si existe)
      qty, // Unidades
      revenue, // Ingresos (USD base de la app)
      unit, // Precio unitario (si venía)
      date: d, // Objeto Date o null
      ym: year && month ? `${year}-${String(month).padStart(2, "0")}` : "N/A", // Periodo YYYY-MM
      pay: COLS.pay ? r[COLS.pay] : "Desconocido", // Método de pago
      region: COLS.region ? r[COLS.region] : null, // Región (si existe)
      country: COLS.country ? r[COLS.country] : null, // País (si existe)
    };
  });
}

// Suma valores por clave usando funciones keyFn y valueFn; retorna Map<key, sum>
export function groupSum(rows, keyFn, valueFn) {
  const map = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (k == null || k === "") continue; // Omite claves vacías
    const v = Number(valueFn(r)) || 0; // Asegura número
    map.set(k, (map.get(k) || 0) + v); // Acumula suma
  }
  return map;
}

// Ordena descendente por valor y devuelve los primeros N pares [key, value]
export function sortTopN(map, n = 10) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

// Calcula KPIs globales: revenue total, unidades, transacciones y ticket promedio (ATV)
export function computeKpis(rows) {
  const revenue = rows.reduce((acc, r) => acc + (r.revenue || 0), 0); // Ingresos totales
  const units = rows.reduce((acc, r) => acc + (r.qty || 0), 0); // Unidades totales
  const tx = rows.length; // Número de transacciones
  const atv = tx ? revenue / tx : 0; // Ticket promedio
  return { revenue, units, tx, atv }; // KPIs agregados
}
