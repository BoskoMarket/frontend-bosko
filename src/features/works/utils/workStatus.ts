import type { WorkPhoto } from '../types';

export const WORK_HIDDEN_LABEL = 'Oculta por denuncias, en revisión';

/** A photo is hidden only when the backend says so; a missing status means visible. */
export function isWorkHidden(photo: Pick<WorkPhoto, 'status'>): boolean {
  return photo.status === 'HIDDEN';
}

/** Accessibility label of a tile in "Mis trabajos". */
export function workLabel(photo: Pick<WorkPhoto, 'status' | 'description'>): string {
  if (isWorkHidden(photo)) return `${WORK_HIDDEN_LABEL}. Toca para eliminar la foto`;
  return photo.description ? `Editar foto: ${photo.description}` : 'Editar foto';
}
