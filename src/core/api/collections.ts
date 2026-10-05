/** El interceptor ya retiró el envelope. Aquí solo se normaliza la paginación. */
export function readCollection<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) return data.data as T[];
  throw new Error('El servidor devolvió una lista con un formato inesperado.');
}
