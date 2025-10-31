// /js/data/loader.js
export async function loadDefaultCsv() {
  const resp = await fetch('data/datos_taller_software.csv', { cache: 'no-store' });
  if (!resp.ok) throw new Error('No se pudo cargar data/datos_taller_software.csv');
  return resp.text();
}

export function loadCsvFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsText(file, 'utf-8');
  });
}
