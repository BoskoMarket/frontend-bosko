import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { Badge, Card, PALETTE, TOKENS } from '@/core/design-system';
import { useThemeStore } from '@/stores/theme.store';
import { ORDER_STATUS } from '@/features/orders/constants/orderStatus';

describe('order status mapping', () => {
  afterEach(() => { act(() => { useThemeStore.getState().setMode('dark'); }); });

  it('every status maps to a TOKENS.status tone', () => {
    Object.values(ORDER_STATUS).forEach((info) => {
      expect(TOKENS.status[info.tone]).toBeDefined();
      expect(info.label).toBeTruthy();
    });
  });

  it.each(['dark', 'light'] as const)('Badge for each status uses its status color (%s)', (mode) => {
    act(() => { useThemeStore.getState().setMode(mode); });
    Object.values(ORDER_STATUS).forEach((info) => {
      const { toJSON, unmount } = render(<Badge label={info.label} tone={info.tone} />);
      const tree = JSON.stringify(toJSON());
      expect(tree).toContain(TOKENS.status[info.tone].fg);
      unmount();
    });
  });

  it.each(['dark', 'light'] as const)('Card keeps its surface color and accepts contentStyle (%s)', (mode) => {
    act(() => { useThemeStore.getState().setMode(mode); });
    const { toJSON } = render(
      <Card contentStyle={{ gap: 7 }}><Text>x</Text></Card>,
    );
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(PALETTE[mode].card);
    expect(tree).toContain('"gap":7');
  });
});

describe('orders, payments and plans have no hard-coded design literals', () => {
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
    ...walk(path.join(repo, 'src/features/orders')),
    ...walk(path.join(repo, 'src/features/payments')),
    ...walk(path.join(repo, 'src/features/plans')),
    ...walk(path.join(repo, 'app/orders')),
    path.join(repo, 'app/(tabs)/orders.tsx'),
    path.join(repo, 'app/(tabs)/profile/plans.tsx'),
    path.join(repo, 'app/(tabs)/profile/Payments.tsx'),
  ];

  it('finds the files', () => {
    expect(files.length).toBeGreaterThan(15);
  });

  it.each(files.map((f) => [path.relative(repo, f).replace(/\\/g, '/'), f]))('%s', (rel, abs) => {
    const src = stripComments(fs.readFileSync(abs, 'utf8'));
    expect({ file: rel, raw: raw.exec(src)?.[0] ?? null }).toEqual({ file: rel, raw: null });
    expect({ file: rel, named: named.exec(src)?.[0] ?? null }).toEqual({ file: rel, named: null });
  });
});
