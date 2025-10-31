// /js/core/formatters.js
export const fmtCurrency = (n, symbol = '$') =>
  symbol + Number(n || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 });

export const fmtNumber = (n) => Number(n || 0).toLocaleString('es-CL');

export const shorten = (s, max = 16) =>
  String(s ?? '').length > max ? String(s).slice(0, max - 1) + '…' : String(s ?? '');
