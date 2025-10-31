// /js/core/formatters.js

// Formateador USD explícito: "USD $1,234.56"
const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  // Puedes forzar 0 o 2 decimales según prefieras:
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmtCurrency = (n) => `USD ${USD_FORMATTER.format(Number(n || 0))}`;

export const fmtNumber = (n) => Number(n || 0).toLocaleString('es-CL');

export const shorten = (s, max = 16) =>
  String(s ?? '').length > max ? String(s).slice(0, max - 1) + '…' : String(s ?? '');
