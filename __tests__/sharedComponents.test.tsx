import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PREMIUM_PALETTE, usePremiumColors, useThemeColors, PALETTE } from '@/core/design-system';
import { useThemeStore } from '@/stores/theme.store';
import { PremiumButton } from '@/components/PremiumButton';
import { FeaturesSection } from '@/components/FeaturesSection';
import { BrandMark } from '@/components/BrandMark';
import { ThemeToggle } from '@/components/ThemeToggle';

function Probe() {
  const pc = usePremiumColors();
  const tc = useThemeColors();
  return (
    <>
      <Text testID="premium-bg">{pc.background}</Text>
      <Text testID="premium-gold">{pc.gold}</Text>
      <Text testID="theme-bg">{tc.bg}</Text>
    </>
  );
}

describe('shared components follow the theme', () => {
  afterEach(() => { act(() => { useThemeStore.getState().setMode("dark"); }); });

  it('usePremiumColors switches with the theme mode', () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId('premium-bg').props.children).toBe(PREMIUM_PALETTE.dark.background);
    expect(getByTestId('theme-bg').props.children).toBe(PALETTE.dark.bg);
    act(() => { useThemeStore.getState().setMode("light"); });
    expect(getByTestId('premium-bg').props.children).toBe(PREMIUM_PALETTE.light.background);
    expect(getByTestId('premium-gold').props.children).toBe(PREMIUM_PALETTE.light.gold);
    expect(getByTestId('theme-bg').props.children).toBe(PALETTE.light.bg);
  });

  it.each(['dark', 'light'] as const)('renders premium and brand components in %s mode', (mode) => {
    act(() => { useThemeStore.getState().setMode(mode); });
    const { getByText, toJSON } = render(
      <>
        <PremiumButton title="Suscribirme" onPress={() => {}} />
        <PremiumButton title="Outline" variant="outline" onPress={() => {}} />
        <FeaturesSection />
        <BrandMark variant="lockup" tagline />
        <ThemeToggle />
      </>,
    );
    expect(getByText('Suscribirme')).toBeTruthy();
    expect(getByText('Confianza Total')).toBeTruthy();
    expect(JSON.stringify(toJSON())).toContain(PALETTE[mode].text);
  });
});

describe('shared UI has no hard-coded design literals', () => {
  const root = path.resolve(__dirname, '../src');
  const dirs = ['components', 'core/components'];
  const raw = /#[0-9a-fA-F]{3,8}\b|rgba?\(|fontFamily:\s*['"]/;

  it.each(dirs)('src/%s', (dir) => {
    for (const f of fs.readdirSync(path.join(root, dir)).filter((n) => /\.(ts|tsx)$/.test(n))) {
      const src = fs.readFileSync(path.join(root, dir, f), 'utf8');
      expect({ file: `${dir}/${f}`, match: raw.exec(src)?.[0] ?? null }).toEqual({ file: `${dir}/${f}`, match: null });
    }
  });
});
