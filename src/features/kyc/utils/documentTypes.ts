/**
 * Document types shown in the KYC intro. `GET /identity/status` may return
 * `allowedDocumentTypes` (per city); when it does, only those are shown,
 * otherwise the fixed list used until now.
 */
export const DEFAULT_DOCUMENT_TYPES: readonly string[] = ['DNI', 'CEDULA', 'PASAPORTE'];

const LABELS: Record<string, string> = {
  DNI: 'DNI',
  CC: 'Cédula de ciudadanía',
  CEDULA: 'Cédula',
  PASAPORTE: 'Pasaporte',
  RUT: 'RUT',
};

export function resolveDocumentTypes(allowed?: unknown): string[] {
  if (Array.isArray(allowed)) {
    const clean = allowed.filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
    if (clean.length > 0) return clean;
  }
  return [...DEFAULT_DOCUMENT_TYPES];
}

export function documentTypeLabel(type: string): string {
  return LABELS[type.toUpperCase()] ?? type;
}

/** "DNI, Cédula o Pasaporte" */
export function formatDocumentTypes(types: string[]): string {
  const labels = types.map(documentTypeLabel);
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} o ${labels[labels.length - 1]}`;
}
