// /js/core/columns.js
import { normalizeKey } from './csv.js';

function getFirstExistingKey(obj, candidates) {
  for (const c of candidates) {
    const k = normalizeKey(c);
    if (k in obj) return k;
  }
  return null;
}

export function mapColumns(sampleRow) {
  const COLS = {
    product: getFirstExistingKey(sampleRow, [
      'nombre_producto','producto','nombre','item','articulo','artículo',
    ]),
    qty: getFirstExistingKey(sampleRow, [
      'cantidad','unidades','cantidad_vendida','cant','unidades_vendidas',
    ]),
    revenue: getFirstExistingKey(sampleRow, [
      'total','ingresos','monto_total','importe','total_venta','venta_total',
      'total_clp','total_$','total_con_iva','total_sin_iva','total_bruto','total_neto',
    ]),
    unit: getFirstExistingKey(sampleRow, [
      'precio_unitario','precio','valor_unitario','pu',
    ]),
    date: getFirstExistingKey(sampleRow, [
      'fecha','fecha_venta','dia','día',
    ]),
    pay: getFirstExistingKey(sampleRow, [
      'metodo_pago','metodo','pago','forma_de_pago','tipo_pago',
    ]),
    region: getFirstExistingKey(sampleRow, [
      'region','región','estado','departamento',
    ]),
    country: getFirstExistingKey(sampleRow, [
      'pais','país','country',
    ]),
    // NUEVO: categoría
    category: getFirstExistingKey(sampleRow, [
      'categoria','categoría','category','subcategoria','subcategoría',
    ]),
  };

  // Requeridos mínimos
  for (const required of ['product', 'qty', 'date']) {
    if (!COLS[required]) throw new Error(`Falta columna requerida en el CSV: ${required}`);
  }
  if (!COLS.revenue && !COLS.unit) {
    throw new Error('No hay columna de ingresos ni precio_unitario para derivarlo.');
  }
  return COLS;
}
