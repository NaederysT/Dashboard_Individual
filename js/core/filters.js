// /js/core/filters.js

// Construye facetas únicas (para poblar selects)
export function buildFacets(rows, COLS){
  const setCat = new Set();
  const setPay = new Set();
  const setRegion = new Set();
  const setCountry = new Set();

  for(const r of rows){
    if (COLS.category && r.category) setCat.add(r.category);
    if (COLS.pay      && r.pay)      setPay.add(r.pay);
    if (COLS.region   && r.region)   setRegion.add(r.region);
    if (COLS.country  && r.country)  setCountry.add(r.country);
  }
  return {
    categories: Array.from(setCat).sort(),
    pays:       Array.from(setPay).sort(),
    regions:    Array.from(setRegion).sort(),
    countries:  Array.from(setCountry).sort(),
  };
}

// ====== Helpers de fechas ======
function pad2(n){ return String(n).padStart(2,'0'); }
export function toISODateLocal(d){
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

// Lee yyyy-mm-dd y devuelve Date a medianoche local
function parseISODateLocal(s){
  if(!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if(!m) return null;
  const Y = Number(m[1]), M = Number(m[2]), D = Number(m[3]);
  return new Date(Y, M-1, D, 0, 0, 0, 0);
}

// Rango real de fechas para un arreglo de filas
export function getDateRange(rows){
  let min = null, max = null;
  for(const r of rows){
    const d = r.date instanceof Date ? r.date : null;
    if (!d || isNaN(d)) continue;
    if (!min || d < min) min = d;
    if (!max || d > max) max = d;
  }
  return { min, max }; // Dates o null
}

// Aplica un set de filtros a rows usando r.date (Date real)
export function filterRows(rows, f, COLS){
  const fromDate = parseISODateLocal(f.from);
  const toDate   = parseISODateLocal(f.to);

  // Normaliza si el usuario invierte el rango
  let from = fromDate, to = toDate;
  if (from && to && from > to) [from, to] = [to, from];

  return rows.filter(r=>{
    if (f.category && f.category !== 'ALL') {
      if (!COLS.category) return false;
      if ((r.category ?? '') !== f.category) return false;
    }
    if (f.pay && f.pay !== 'ALL') {
      if (!COLS.pay) return false;
      if ((r.pay ?? '') !== f.pay) return false;
    }
    // Filtrado por fecha
    if (from && r.date && r.date < from) return false;
    if (to   && r.date && r.date > to)   return false;
    return true;
  });
}

// ====== Lógica para límites dinámicos de fechas en formularios ======

// Calcula rango de fechas (min/max ISO) para un subconjunto determinado por category/pay
export function dateRangeForFilters(rows, f, COLS){
  // Ignora from/to (solo interesa restringir por categoría y pago)
  const subset = rows.filter(r=>{
    if (f.category && f.category !== 'ALL') {
      if (!COLS.category) return false;
      if ((r.category ?? '') !== f.category) return false;
    }
    if (f.pay && f.pay !== 'ALL') {
      if (!COLS.pay) return false;
      if ((r.pay ?? '') !== f.pay) return false;
    }
    return true;
  });
  const { min, max } = getDateRange(subset);
  return {
    minISO: min ? toISODateLocal(min) : '',
    maxISO: max ? toISODateLocal(max) : '',
  };
}

// Pone min/max en los inputs del form y corrige valores fuera de rango
export function applyDateLimits(formEl, { minISO, maxISO }){
  if (!formEl) return;
  const iFrom = formEl.querySelector('input[name="from"]');
  const iTo   = formEl.querySelector('input[name="to"]');
  if (iFrom){ iFrom.min = minISO || ''; iFrom.max = maxISO || ''; }
  if (iTo)  { iTo.min   = minISO || ''; iTo.max   = maxISO || ''; }

  // Si el usuario tenía una fecha fuera de rango, la limpiamos
  if (iFrom && iFrom.value && (minISO && iFrom.value < minISO || maxISO && iFrom.value > maxISO)) {
    iFrom.value = '';
  }
  if (iTo && iTo.value && (minISO && iTo.value < minISO || maxISO && iTo.value > maxISO)) {
    iTo.value = '';
  }
}

// Helpers DOM para selects/inputs
export function setOptions(selectEl, values, withAll=true, allLabel='Todas'){
  if(!selectEl) return;
  const prev = selectEl.value;
  selectEl.innerHTML = '';
  if(withAll){
    const optAll = document.createElement('option');
    optAll.value = 'ALL'; optAll.textContent = allLabel;
    selectEl.appendChild(optAll);
  }
  for(const v of values){
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v;
    selectEl.appendChild(opt);
  }
  if (Array.from(selectEl.options).some(o=>o.value===prev)) {
    selectEl.value = prev;
  }
}

export function readFormFilters(formEl){
  const data = new FormData(formEl);
  const obj = Object.fromEntries(data.entries());
  return {
    category: obj.category || 'ALL',
    pay: obj.pay || 'ALL',
    from: obj.from || null, // yyyy-mm-dd
    to:   obj.to   || null, // yyyy-mm-dd
  };
}

export function resetForm(formEl){
  formEl.reset();
  const selCat = formEl.querySelector('select[name="category"]');
  if (selCat) selCat.value = 'ALL';
  const selPay = formEl.querySelector('select[name="pay"]');
  if (selPay) selPay.value = 'ALL';
  const iFrom = formEl.querySelector('input[name="from"]');
  const iTo   = formEl.querySelector('input[name="to"]');
  if (iFrom) iFrom.value = '';
  if (iTo)   iTo.value   = '';
}
