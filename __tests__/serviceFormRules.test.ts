import { validateServiceFields } from '@/features/servicesUser/utils/serviceFormRules';

const DESC_OK = 'd'.repeat(20);

describe('validateServiceFields', () => {
  it('rejects a 9 character title', () => {
    expect(validateServiceFields({ title: 'a'.repeat(9), description: DESC_OK }).title).toMatch(/al menos 10/);
  });

  it('accepts a 10 character title', () => {
    expect(validateServiceFields({ title: 'a'.repeat(10), description: DESC_OK }).title).toBeUndefined();
  });

  it('accepts 255 and rejects 256 characters', () => {
    expect(validateServiceFields({ title: 'a'.repeat(255), description: DESC_OK }).title).toBeUndefined();
    expect(validateServiceFields({ title: 'a'.repeat(256), description: DESC_OK }).title).toMatch(/255/);
  });

  it('trims whitespace before measuring the title', () => {
    expect(validateServiceFields({ title: `  ${'a'.repeat(9)}  `, description: DESC_OK }).title).toBeDefined();
    expect(validateServiceFields({ title: `  ${'a'.repeat(10)}  `, description: DESC_OK }).title).toBeUndefined();
  });

  it('requires a non-empty title', () => {
    expect(validateServiceFields({ title: '   ', description: DESC_OK }).title).toMatch(/obligatorio/);
  });

  it('rejects a 19 character description and accepts 20', () => {
    expect(validateServiceFields({ title: 'a'.repeat(10), description: 'd'.repeat(19) }).description).toBeDefined();
    expect(validateServiceFields({ title: 'a'.repeat(10), description: DESC_OK }).description).toBeUndefined();
  });
});
