import { categoryVisual, HERO_IMAGE, normalizeCategoryName } from '@/features/servicesUser/utils/categoryVisuals';

describe('categoryVisuals', () => {
  it('normalizes names', () => {
    expect(normalizeCategoryName('Plomería')).toBe('plomeria');
    expect(normalizeCategoryName('Clases particulares')).toBe('clases-particulares');
    expect(normalizeCategoryName('  CONSTRUCCIÓN ')).toBe('construccion');
  });

  it('returns image and subtitle for known trades', () => {
    const v = categoryVisual('Electricidad');
    expect(v.image).toBeTruthy();
    expect(v.subtitle).toMatch(/matriculados/);
    expect(categoryVisual('Clases particulares').image).toBeTruthy();
  });

  it('falls back for unknown categories', () => {
    const v = categoryVisual('Jardinería');
    expect(v.image).toBeUndefined();
    expect(v.subtitle).toBe('Profesionales verificados cerca tuyo.');
  });

  it('exports the hero image', () => {
    expect(HERO_IMAGE).toBeTruthy();
  });
});
