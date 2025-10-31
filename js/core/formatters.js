// /js/core/formatters.js — Formatea montos en USD, números con separadores y acorta etiquetas

// Configura Intl para formatear en USD con 2 decimales
const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Devuelve monto en formato “USD $1,234.56”
export const fmtCurrency = (n) => `USD ${USD_FORMATTER.format(Number(n || 0))}`;

// Devuelve números con miles según es-CL
export const fmtNumber = (n) => Number(n || 0).toLocaleString("es-CL");

// Acorta cadenas largas y agrega “…” si exceden max
export const shorten = (s, max = 16) =>
  String(s ?? "").length > max
    ? String(s).slice(0, max - 1) + "…"
    : String(s ?? "");
