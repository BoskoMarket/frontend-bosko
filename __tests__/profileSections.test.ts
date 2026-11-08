import * as fs from 'fs';
import * as path from 'path';
import { getRoleSection, INFO_SECTION } from '@/features/profile/utils/profileSections';

let mockReels = false;
let mockPayments = false;
jest.mock('@/core/config/features', () => ({
  FEATURES: {
    get reels() { return mockReels; },
    get payments() { return mockPayments; },
  },
}));

const repo = path.resolve(__dirname, '..');

/** True when an expo-router file exists for the href (file or folder index). */
function routeExists(href: string): boolean {
  const base = path.join(repo, 'app', href.replace(/^\//, ''));
  return ['.tsx', '/index.tsx'].some((suffix) => fs.existsSync(base + suffix));
}

describe('getRoleSection', () => {
  beforeEach(() => {
    mockReels = false;
    mockPayments = false;
  });

  it('shows the Plan row only when payments are enabled', () => {
    expect(getRoleSection('provider')!.rows.map((r) => r.id)).not.toContain('plan');
    mockPayments = true;
    expect(getRoleSection('provider')!.rows.find((r) => r.id === 'plan')?.href).toBe('/(tabs)/profile/plans');
  });

  it('adds Mis reels for providers only when the reels flag is on', () => {
    expect(getRoleSection('provider')!.rows.map((r) => r.id)).not.toContain('my-reels');
    mockReels = true;
    const rows = getRoleSection('provider')!.rows;
    expect(rows.map((r) => r.label)).toContain('Mis reels');
    expect(rows.find((r) => r.id === 'my-reels')?.href).toBe('/(tabs)/profile/my-reels');
  });

  it('gives providers their business rows', () => {
    const section = getRoleSection('provider')!;
    expect(section.title).toBe('Mi negocio');
    expect(section.rows.map((r) => r.label)).toEqual([
      'Mis servicios',
      'Publicar servicio',
      'Mis trabajos',
      'Mis reseñas',
      'Verificación de identidad',
      'Antecedentes penales',
    ]);
    expect(section.rows.find((r) => r.id === 'publish-service')?.href).toBe('/service-form');
  });

  it('gives clients favorites and the become-provider entry', () => {
    const section = getRoleSection('client')!;
    expect(section.rows.map((r) => r.label)).toEqual(['Favoritos', 'Convertirme en proveedor']);
  });

  it('leaves users mid-verification to the pending card', () => {
    expect(getRoleSection('pending')).toBeNull();
  });

  it('never mixes provider-only rows into the client group (and vice versa)', () => {
    const client = getRoleSection('client')!.rows.map((r) => r.id);
    const provider = getRoleSection('provider')!.rows.map((r) => r.id);
    expect(client).not.toContain('my-services');
    expect(provider).not.toContain('become-provider');
  });

  it('only points to routes that exist in app/', () => {
    mockReels = true;
    mockPayments = true;
    const rows = [...getRoleSection('provider')!.rows, ...getRoleSection('client')!.rows];
    rows.forEach((row) => expect({ href: row.href, exists: routeExists(row.href) }).toEqual({ href: row.href, exists: true }));
  });
});

describe('INFO_SECTION', () => {
  it('links the terms and conditions for every role', () => {
    expect(INFO_SECTION.rows.map((r) => r.label)).toEqual(['Términos y condiciones']);
    expect(routeExists(INFO_SECTION.rows[0].href)).toBe(true);
  });
});
