import { validateServiceFields } from '@/features/servicesUser/utils/serviceFormRules';
import { formatServicePrice } from '@/core/design-system';

const OK = { title: 'a'.repeat(10), description: 'd'.repeat(20) };

describe('main photo is required (a service without one is not listed)', () => {
  it('reports a missing photo only when the caller says there is none', () => {
    expect(validateServiceFields({ ...OK, hasPhoto: false }).photo).toMatch(/foto principal/);
    expect(validateServiceFields({ ...OK, hasPhoto: true }).photo).toBeUndefined();
    expect(validateServiceFields(OK).photo).toBeUndefined();
  });
});

describe('formatServicePrice', () => {
  it('shows "A cotizar" without a usable amount', () => {
    expect(formatServicePrice(undefined)).toBe('A cotizar');
    expect(formatServicePrice(null)).toBe('A cotizar');
    expect(formatServicePrice({ amount: 0, currency: 'ARS' })).toBe('A cotizar');
    expect(formatServicePrice({ amount: null })).toBe('A cotizar');
    expect(formatServicePrice({ amount: 'abc' })).toBe('A cotizar');
  });

  it('prefixes "Desde" and always shows the currency code (ARS and COP share "$")', () => {
    expect(formatServicePrice({ amount: 18500, currency: 'ARS' })).toBe('Desde $18.500 ARS');
    expect(formatServicePrice({ amount: 45000, currency: 'COP' })).toBe('Desde $45.000 COP');
  });

  it('accepts amounts as strings and an optional unit', () => {
    expect(formatServicePrice({ amount: '1200', currency: 'ARS', unit: 'hora' })).toBe('Desde $1.200 ARS / hora');
  });

  it('defaults to ARS when the currency is missing', () => {
    expect(formatServicePrice({ amount: 500 })).toBe('Desde $500 ARS');
  });
});
