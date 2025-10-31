// /js/core/columns.js — Mapea nombres de columnas reales a claves estándar esperadas por la app

import { normalizeKey } from "./csv.js";

// Retorna la primera clave existente en obj a partir de una lista de alias candidatos
function getFirstExistingKey(obj, candidates) {
  for (const c of candidates) {
    const k = normalizeKey(c);
    if (k in obj) return k;
  }
  return null;
}

// Construye el objeto COLS con las claves canónicas detectadas y valida requeridos
export function mapColumns(sampleRow) {
  const COLS = {
    product: getFirstExistingKey(sampleRow, [
      // Nombre del producto
      "nombre_producto",
      "producto",
      "nombre",
      "item",
      "articulo",
      "artículo",
    ]),
    qty: getFirstExistingKey(sampleRow, [
      // Cantidad/unidades vendidas
      "cantidad",
      "unidades",
      "cantidad_vendida",
      "cant",
      "unidades_vendidas",
    ]),
    revenue: getFirstExistingKey(sampleRow, [
      // Monto/ingresos totales de la fila
      "total",
      "ingresos",
      "monto_total",
      "importe",
      "total_venta",
      "venta_total",
      "total_clp",
      "total_$",
      "total_con_iva",
      "total_sin_iva",
      "total_bruto",
      "total_neto",
    ]),
    unit: getFirstExistingKey(sampleRow, [
      // Precio unitario (fallback para revenue)
      "precio_unitario",
      "precio",
      "valor_unitario",
      "pu",
    ]),
    date: getFirstExistingKey(sampleRow, [
      // Fecha de la transacción
      "fecha",
      "fecha_venta",
      "dia",
      "día",
    ]),
    pay: getFirstExistingKey(sampleRow, [
      // Método/forma de pago
      "metodo_pago",
      "metodo",
      "pago",
      "forma_de_pago",
      "tipo_pago",
    ]),
    region: getFirstExistingKey(sampleRow, [
      // Región/estado/departamento
      "region",
      "región",
      "estado",
      "departamento",
    ]),
    country: getFirstExistingKey(sampleRow, [
      // País
      "pais",
      "país",
      "country",
    ]),
    category: getFirstExistingKey(sampleRow, [
      // Categoría/subcategoría del producto
      "categoria",
      "categoría",
      "category",
      "subcategoria",
      "subcategoría",
    ]),
  };

  // Valida presencia de mínimos requeridos para operar (producto, cantidad y fecha)
  for (const required of ["product", "qty", "date"]) {
    if (!COLS[required])
      throw new Error(`Falta columna requerida en el CSV: ${required}`);
  }

  // Exige revenue o, en su defecto, unit para derivar revenue = unit * qty
  if (!COLS.revenue && !COLS.unit) {
    throw new Error(
      "No hay columna de ingresos ni precio_unitario para derivarlo."
    );
  }

  return COLS; // Devuelve mapeo de columnas detectadas
}
