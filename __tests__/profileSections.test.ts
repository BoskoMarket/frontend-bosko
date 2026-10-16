import * as fs from 'fs';
import * as path from 'path';
import { getRoleSection } from '@/features/profile/utils/profileSections';

const repo = path.resolve(__dirname, '..');

/** True when an expo-router file exists for the href (file or folder index). */
function routeExists(href: string): boolean {
  const base = path.join(repo, 'app', href.replace(/^\//, ''));
  return ['.tsx', '/index.tsx'].some((suffix) => fs.existsSync(base + suffix));
}

describe('getRoleSection', () => {
  it('gives providers their business rows', () => {
    const section = getRoleSection('provider')!;
    expect(section.title).toBe('Mi negocio');
    expect(section.rows.map((r) => r.label)).toEqual([
      'Mis servicios',
      'Publicar servicio',
      'Mis reels',
      'Mis reseñas',
      'Verificación de identidad',
      'Antecedentes penales',
      'Plan',
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
    const rows = [...getRoleSection('provider')!.rows, ...getRoleSection('client')!.rows];
    rows.forEach((row) => expect({ href: row.href, exists: routeExists(row.href) }).toEqual({ href: row.href, exists: true }));
  });
});
