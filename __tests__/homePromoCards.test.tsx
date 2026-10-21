import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import {
  CategoryPromoCard,
  FeaturedPromoCard,
  SearchTrigger,
  getCategoryTint,
  CATEGORY_TINT_COUNT,
  resolveCategoryIcon,
} from '@/core/design-system';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/theme.store';

const IMG = { uri: 'https://example.com/person.png' };

describe('home promo cards', () => {
  afterEach(() => act(() => { useThemeStore.getState().setMode('dark'); }));

  it('SearchTrigger shows the placeholder and fires onPress', () => {
    const onPress = jest.fn();
    const { getByText, getByRole } = render(<SearchTrigger placeholder="Buscar" onPress={onPress} />);
    expect(getByText('Buscar')).toBeTruthy();
    fireEvent.press(getByRole('button'));
    expect(getByRole('button').props.accessibilityHint).toBe('Abre la búsqueda');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('CategoryPromoCard renders copy and fires onPress', () => {
    const onPress = jest.fn();
    const { getByText, getByRole } = render(
      <CategoryPromoCard title="Plomería" subtitle="Arreglos rápidos" ctaLabel="Ver profesionales" tintIndex={0} icon="water-outline" image={IMG} onPress={onPress} />,
    );
    expect(getByText('Plomería')).toBeTruthy();
    expect(getByText('Arreglos rápidos')).toBeTruthy();
    expect(getByText('Ver profesionales')).toBeTruthy();
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('CategoryPromoCard never renders an emoji icon', () => {
    const { queryByText, getByText } = render(
      <CategoryPromoCard title="Gas" ctaLabel="Ver" tintIndex={2} icon="🔥" onPress={() => {}} />,
    );
    expect(getByText('Gas')).toBeTruthy();
    expect(queryByText('🔥')).toBeNull();
  });

  it('CategoryPromoCard shows the glyph once without image and once (small icon) with image', () => {
    const noImg = render(<CategoryPromoCard title="Gas" ctaLabel="Ver" tintIndex={2} icon="flame-outline" onPress={() => {}} />);
    expect(noImg.UNSAFE_queryAllByType(Ionicons).length).toBe(1);
    noImg.unmount();
    const withImg = render(<CategoryPromoCard title="Gas" ctaLabel="Ver" tintIndex={2} icon="flame-outline" image={IMG} onPress={() => {}} />);
    expect(withImg.UNSAFE_queryAllByType(Ionicons).length).toBe(1);
  });

  it('resolveCategoryIcon accepts Ionicons names only', () => {
    expect(resolveCategoryIcon('water-outline')).toBe('water-outline');
    expect(resolveCategoryIcon('⚡')).toBe('construct-outline');
    expect(resolveCategoryIcon('toString')).toBe('construct-outline');
    expect(resolveCategoryIcon(undefined)).toBe('construct-outline');
  });

  it('FeaturedPromoCard renders eyebrow, badge, title, CTA and fires onPress', () => {
    const onPress = jest.fn();
    const { getByText, getByRole } = render(
      <FeaturedPromoCard eyebrow="Destacado" badge="Verificados" title="Profesionales de confianza" ctaLabel="Explorar" tintIndex={1} image={IMG} onPress={onPress} />,
    );
    ['Destacado', 'Verificados', 'Profesionales de confianza', 'Explorar'].forEach((t) => expect(getByText(t)).toBeTruthy());
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('FeaturedPromoCard renders without image or optional pills', () => {
    const { getByText } = render(<FeaturedPromoCard title="Hola" ctaLabel="Ir" tintIndex={0} onPress={() => {}} />);
    expect(getByText('Hola')).toBeTruthy();
  });

  it('cards render in light and dark', () => {
    for (const mode of ['light', 'dark'] as const) {
      act(() => { useThemeStore.getState().setMode(mode); });
      const { getByText, unmount } = render(<CategoryPromoCard title="T" ctaLabel="Ir" tintIndex={3} onPress={() => {}} />);
      expect(getByText('T')).toBeTruthy();
      unmount();
    }
  });

  it('getCategoryTint treats a non-finite index as 0', () => {
    expect(getCategoryTint(NaN, false)).toEqual(getCategoryTint(0, false));
    expect(getCategoryTint(Infinity, true)).toEqual(getCategoryTint(0, true));
  });

  it('getCategoryTint cycles by index and differs per theme', () => {
    expect(getCategoryTint(0, false)).toEqual(getCategoryTint(CATEGORY_TINT_COUNT, false));
    expect(getCategoryTint(-1, false)).toEqual(getCategoryTint(CATEGORY_TINT_COUNT - 1, false));
    expect(getCategoryTint(0, false).bg).not.toBe(getCategoryTint(1, false).bg);
    expect(getCategoryTint(0, false).bg).not.toBe(getCategoryTint(0, true).bg);
    expect(getCategoryTint(0, true).text).not.toBe(getCategoryTint(0, false).text);
  });
});
