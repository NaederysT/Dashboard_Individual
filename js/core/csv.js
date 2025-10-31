// /js/core/csv.js
function detectDelimiter(firstLine) {
  const candidates = [',', ';', '\t', '|'];
  let best = ',', max = 0;
  for (const d of candidates) {
    const parts = firstLine.split(d).length;
    if (parts > max) { max = parts; best = d; }
  }
  return best;
}

function normalizeKey(s) {
  return String(s || '')
    .trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_ ]/g, '')
    .replace(/\s+/g, '_');
}

export function csvToObjects(text) {
  const raw = String(text).replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];
  const delim = detectDelimiter(lines[0]);

  const rawHeaders = lines[0].split(delim).map((h) => h.trim());
  const headers = rawHeaders.map(normalizeKey);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delim);
    const obj = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = (cols[j] ?? '').trim();
    rows.push(obj);
  }
  return rows;
}

export { normalizeKey };
