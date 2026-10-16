import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { act, render } from '@testing-library/react-native';
import { PALETTE, TOKENS } from '@/core/design-system';
import { useThemeStore } from '@/stores/theme.store';
import { StarRating } from '@/features/servicesUser/components/StarRating';
import { CategoryChips } from '@/features/servicesUser/components/CategoryChips';

describe('servicesUser components follow the theme', () => {
  afterEach(() => { act(() => { useThemeStore.getState().setMode('dark'); }); });

  it.each(['dark', 'light'] as const)('StarRating: filled = rating token, empty = muted text (%s)', (mode) => {
    act(() => { useThemeStore.getState().setMode(mode); });
    const { toJSON } = render(<StarRating value={2} editable={false} />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(TOKENS.color.rating);
    expect(tree).toContain(PALETTE[mode].textMuted);
  });

  it('CategoryChips renders one design-system Chip per item', () => {
    const { getByLabelText } = render(
      <CategoryChips items={[{ id: 'a', label: 'Plomería' }, { id: 'b', label: 'Diseño' }]} />,
    );
    expect(getByLabelText('Plomería')).toBeTruthy();
    expect(getByLabelText('Diseño')).toBeTruthy();
  });
});

describe('servicesUser has no hard-coded design literals', () => {
  const repo = path.resolve(__dirname, '..');
  const raw = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|fontFamily\s*:\s*['"`]/;
  const named = /[cC]olor\s*[:=]\s*\{?\s*['"](?!transparent['"])[a-z]+['"]|tint\s*[:=]\s*\{?\s*['"][a-z]+['"]/;
  const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : /\.tsx?$/.test(e.name) ? [p] : [];
    });

  const files = [
    ...walk(path.join(repo, 'src/features/servicesUser')),
    ...walk(path.join(repo, 'app/(tabs)/services')),
    path.join(repo, 'app/service-form.tsx'),
    path.join(repo, 'app/(tabs)/index.tsx'),
  ];

  it('finds the files', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it.each(files.map((f) => [path.relative(repo, f).replace(/\\/g, '/'), f]))('%s', (rel, abs) => {
    const src = stripComments(fs.readFileSync(abs, 'utf8'));
    expect({ file: rel, raw: raw.exec(src)?.[0] ?? null }).toEqual({ file: rel, raw: null });
    expect({ file: rel, named: named.exec(src)?.[0] ?? null }).toEqual({ file: rel, named: null });
  });
});
