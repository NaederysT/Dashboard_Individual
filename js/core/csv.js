// /js/core/csv.js — Detecta separador, normaliza headers y convierte CSV a objetos

// Heurística simple: elige el delimitador con más “splits” en la primera línea
function detectDelimiter(firstLine) {
  const candidates = [",", ";", "\t", "|"];
  let best = ",",
    max = 0;
  for (const d of candidates) {
    const parts = firstLine.split(d).length;
    if (parts > max) {
      max = parts;
      best = d;
    }
  }
  return best;
}

// Normaliza encabezados: trim, minúsculas, sin acentos, solo [a-z0-9_], espacios→guion_bajo
function normalizeKey(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_ ]/g, "")
    .replace(/\s+/g, "_");
}

// Parsea el CSV a un arreglo de objetos usando el delimitador detectado y headers normalizados
export function csvToObjects(text) {
  const raw = String(text).replace(/^\uFEFF/, ""); // Quita BOM si existe
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0); // Separa líneas no vacías
  if (!lines.length) return [];
  const delim = detectDelimiter(lines[0]); // Determina separador

  const rawHeaders = lines[0].split(delim).map((h) => h.trim()); // Lee encabezados crudos
  const headers = rawHeaders.map(normalizeKey); // Normaliza nombres de columnas

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    // Itera filas de datos
    const cols = lines[i].split(delim); // Separa columnas por delimitador
    const obj = {};
    for (let j = 0; j < headers.length; j++)
      obj[headers[j]] = (cols[j] ?? "").trim(); // Mapea col→header
    rows.push(obj); // Agrega fila como objeto
  }
  return rows; // Devuelve arreglo de objetos
}

// Reexporta helper de normalización para otros módulos (e.g., columns.js)
export { normalizeKey };
