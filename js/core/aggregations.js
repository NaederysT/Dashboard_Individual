// /js/core/aggregations.js
function parseNumber(v) {
  if (v === null || v === undefined) return 0;
  let s = String(v).trim();
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) s = s.replace(/\./g, '').replace(',', '.');
  else if (hasComma && !hasDot) s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function parseDateSmart(v) {
  const s = String(v || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split('/').map((x) => parseInt(x, 10));
    return new Date(yyyy, mm - 1, dd);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function normalizeRows(rows, COLS) {
  return rows.map((r) => {
    const d = parseDateSmart(r[COLS.date]);
    const year = d ? d.getFullYear() : null;
    const month = d ? d.getMonth() + 1 : null;

    const qty = parseNumber(r[COLS.qty]);
    const unit = COLS.unit ? parseNumber(r[COLS.unit]) : null;
    const revenue = COLS.revenue ? parseNumber(r[COLS.revenue]) : (unit !== null ? unit * qty : 0);

    return {
      product: r[COLS.product],
      category: COLS.category ? r[COLS.category] : null, // <- NUEVO
      qty,
      revenue,
      unit,
      date: d,
      ym: year && month ? `${year}-${String(month).padStart(2, '0')}` : 'N/A',
      pay: COLS.pay ? r[COLS.pay] : 'Desconocido',
      region: COLS.region ? r[COLS.region] : null,
      country: COLS.country ? r[COLS.country] : null,
    };
  });
}

export function groupSum(rows, keyFn, valueFn) {
  const map = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (k == null || k === '') continue;
    const v = Number(valueFn(r)) || 0;
    map.set(k, (map.get(k) || 0) + v);
  }
  return map;
}

export function sortTopN(map, n = 10) {
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, n);
}

export function computeKpis(rows) {
  const revenue = rows.reduce((acc, r) => acc + (r.revenue || 0), 0);
  const units = rows.reduce((acc, r) => acc + (r.qty || 0), 0);
  const tx = rows.length;
  const atv = tx ? revenue / tx : 0;
  return { revenue, units, tx, atv };
}
