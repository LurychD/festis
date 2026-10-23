/**
 * Utilidades de cálculo y validación de fechas para Festis.
 */

/**
 * Determina si una convocatoria/festival fue creado en las últimas 24 horas.
 * Utilizado para exhibir la insignia visual "Nuevo" en listas y vistas de detalle.
 */
export function isNewFestival(createdAt?: string): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (isNaN(created)) return false;
  return Date.now() - created < 24 * 60 * 60 * 1000;
}
