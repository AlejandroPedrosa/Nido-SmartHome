/**
 * Convierte el valor de CORS_ORIGIN en una lista de orígenes permitidos.
 * Admite varios orígenes separados por coma, ignora espacios y entradas
 * vacías, y quita la barra final para que coincida con el header Origin.
 *
 * @example parseCorsOrigins('http://localhost:5173, https://nido.vercel.app/')
 * // ['http://localhost:5173', 'https://nido.vercel.app']
 */
export function parseCorsOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin.length > 0);
}
