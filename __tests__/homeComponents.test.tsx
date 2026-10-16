import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import {
  PathCard,
  ServiceCard,
  StatTile,
  StepCard,
  TrustRow,
  ValueHero,
  formatServicePrice,
} from '@/core/design-system';
import { useThemeStore } from '@/stores/theme.store';

describe('formatServicePrice', () => {
  it('formats ARS and USD amounts', () => {
    expect(formatServicePrice({ amount: 18500, currency: 'ARS' })).toBe('$18.500');
    expect(formatServicePrice({ amount: 40, currency: 'USD' })).toBe('US$40');
  });

  it('falls back to "Consultar" without a usable amount', () => {
    expect(formatServicePrice(undefined)).toBe('Consultar');
    expect(formatServicePrice({ amount: 0, currency: 'ARS' })).toBe('Consultar');
  });
});

describe.each(['dark', 'light'] as const)('home components (%s theme)', (mode) => {
  beforeEach(() => useThemeStore.setState({ mode }));

  it('ServiceCard shows meta, title, rating, price and the availability pill', () => {
    const onPress = jest.fn();
    const { getByText, queryByText } = render(
      <ServiceCard
        title="Instalación de tomas"
        category="Electricidad"
        location="Palermo"
        rating={4.8}
        reviewsCount={32}
        price="$18.500"
        isAvailable
        onPress={onPress}
      />,
    );
    expect(getByText('Electricidad · Palermo')).toBeTruthy();
    expect(getByText('4.8 (32)')).toBeTruthy();
    expect(getByText('$18.500')).toBeTruthy();
    expect(getByText('Disponible hoy')).toBeTruthy();
    expect(queryByText('Quitar de favoritos')).toBeNull();
    fireEvent.press(getByText('Instalación de tomas'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ServiceCard hides the pill and rating when there is no data, and toggles favorite', () => {
    const onToggle = jest.fn();
    const onPress = jest.fn();
    const { queryByText, getByLabelText } = render(
      <ServiceCard title="Sin datos" onPress={onPress} onToggleFavorite={onToggle} isFavorite={false} />,
    );
    expect(queryByText('Disponible hoy')).toBeNull();
    fireEvent.press(getByLabelText('Agregar a favoritos'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('ValueHero renders copy and fires the search trigger', () => {
    const onSearch = jest.fn();
    const { getByText, getByLabelText } = render(
      <ValueHero eyebrow="Eyebrow" title="Titulo" body="Cuerpo" searchPlaceholder="Buscar algo" onSearchPress={onSearch} />,
    );
    expect(getByText('Eyebrow')).toBeTruthy();
    expect(getByText('Titulo')).toBeTruthy();
    expect(getByText('Cuerpo')).toBeTruthy();
    fireEvent.press(getByLabelText('Buscar algo'));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('ValueHero omits the search row without onSearchPress', () => {
    const { queryByText } = render(<ValueHero title="T" searchPlaceholder="Buscar algo" />);
    expect(queryByText('Buscar algo')).toBeNull();
  });

  it('PathCard is pressable', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PathCard icon="search-outline" title="Contratar" description="Desc" linkLabel="Ir →" onPress={onPress} />,
    );
    expect(getByText('Desc')).toBeTruthy();
    fireEvent.press(getByText('Contratar'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('StepCard, TrustRow and StatTile render their copy', () => {
    const { getByText } = render(
      <>
        <StepCard number="01" title="Buscá" caption="Por rubro" />
        <TrustRow icon="shield-checkmark-outline" title="Verificada" caption="Identidad" />
        <StatTile value="4.8" label="Rating" />
      </>,
    );
    ['01', 'Buscá', 'Por rubro', 'Verificada', 'Identidad', '4.8', 'Rating'].forEach((t) => expect(getByText(t)).toBeTruthy());
  });
});
