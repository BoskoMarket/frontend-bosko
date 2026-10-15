import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { act, render } from '@testing-library/react-native';
import { Badge, TOKENS, PALETTE } from '@/core/design-system';
import { useThemeStore } from '@/stores/theme.store';
import { KYC_STATUS, BACKGROUND_CHECK_STATUS, toneColors } from '@/features/kyc/constants/kycStatus';
import type { KYCStatus } from '@/features/kyc/types/kyc.types';

const ALL_KYC_STATUSES: KYCStatus[] = [
  'not_started', 'in_progress', 'pending', 'approved', 'rejected', 'declined', 'failed', 'expired',
];

describe('kyc status mapping', () => {
  afterEach(() => { act(() => { useThemeStore.getState().setMode('dark'); }); });

  it('maps every KYC status to copy, an icon and a valid tone', () => {
    ALL_KYC_STATUSES.forEach((status) => {
      const info = KYC_STATUS[status];
      expect(info.title).toBeTruthy();
      expect(info.description).toBeTruthy();
      expect(info.icon).toBeTruthy();
      if (info.tone !== 'brand' && info.tone !== 'neutral') {
        expect(TOKENS.status[info.tone]).toBeDefined();
      }
    });
  });

  it('maps every background-check status to a label, an icon and a valid tone', () => {
    Object.values(BACKGROUND_CHECK_STATUS).forEach((info) => {
      expect(info.label).toBeTruthy();
      expect(info.icon).toBeTruthy();
      if (info.tone !== 'brand' && info.tone !== 'neutral') {
        expect(TOKENS.status[info.tone]).toBeDefined();
      }
    });
  });

  it.each(['dark', 'light'] as const)('toneColors resolves brand / neutral / status tones (%s)', (mode) => {
    const tc = PALETTE[mode];
    expect(toneColors('brand', tc)).toEqual({ fg: TOKENS.color.signal, bg: tc.accent });
    expect(toneColors('neutral', tc)).toEqual({ fg: tc.textSub, bg: tc.surface2 });
    expect(toneColors('done', tc)).toEqual(TOKENS.status.done);
  });

  it.each(['dark', 'light'] as const)('Badge for each status badge uses its tone color (%s)', (mode) => {
    act(() => { useThemeStore.getState().setMode(mode); });
    const tc = PALETTE[mode];
    ALL_KYC_STATUSES.forEach((status) => {
      const info = KYC_STATUS[status];
      if (!info.badge) return;
      const { toJSON, unmount } = render(<Badge label={info.badge} tone={info.tone} size="sm" />);
      expect(JSON.stringify(toJSON())).toContain(toneColors(info.tone, tc).fg);
      unmount();
    });
  });
});

describe('kyc and admin have no hard-coded design literals', () => {
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
    ...walk(path.join(repo, 'src/features/kyc')),
    ...walk(path.join(repo, 'src/features/admin')),
    ...walk(path.join(repo, 'app/admin')),
    ...walk(path.join(repo, 'app/(tabs)/profile/kyc')),
    path.join(repo, 'app/(tabs)/profile/background-check.tsx'),
    path.join(repo, 'app/(tabs)/profile/become-provider.tsx'),
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
