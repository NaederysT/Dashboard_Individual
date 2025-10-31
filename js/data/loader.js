// /js/data/loader.js — Carga CSV por defecto vía fetch o desde archivo local con FileReader

// Descarga el CSV por defecto desde /data sin cachear la respuesta
export async function loadDefaultCsv() {
  const resp = await fetch("data/datos_taller_software.csv", {
    cache: "no-store",
  });
  if (!resp.ok)
    throw new Error("No se pudo cargar data/datos_taller_software.csv"); // Falla si la ruta no responde 2xx
  return resp.text(); // Retorna el contenido del CSV como string
}

// Lee un CSV local seleccionado por el usuario y retorna su contenido como string
export function loadCsvFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); // Usa FileReader para leer archivos del disco
    reader.onload = (e) => resolve(e.target.result); // Resuelve con el texto del archivo
    reader.onerror = (err) => reject(err); // Rechaza ante errores de lectura
    reader.readAsText(file, "utf-8"); // Lee como texto en codificación UTF-8
  });
}
