import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, NoticeBanner, SPACING, Skeleton, Text, TOKENS, useThemeColors } from '@/core/design-system';
import { useCitiesQuery } from '@/hooks/queries/useCitiesQuery';
import { countryName } from '@/features/markets/utils/phone';
import type { City } from '@/features/markets/types';

export interface CityPickerProps {
  /** Selected city id. */
  value: string | null;
  onChange: (city: City) => void;
  /** Field-level error (e.g. "Elige tu ciudad"). */
  error?: string;
}

/** Choose the city (market) from `GET /cities`: loading, error with retry, empty and selected states. */
export function CityPicker({ value, onChange, error }: CityPickerProps) {
  const tc = useThemeColors();
  const { data: cities, isPending, isError, refetch, isRefetching } = useCitiesQuery();
  const selected = cities?.find((city) => city.id === value);

  if (isPending) {
    return (
      <View style={styles.chips} accessibilityLabel="Cargando ciudades">
        <Skeleton width={110} height={36} radius={TOKENS.radius.pill} />
        <Skeleton width={130} height={36} radius={TOKENS.radius.pill} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.group}>
        <NoticeBanner variant="error">No pudimos cargar las ciudades. Revisa tu conexión e intenta de nuevo.</NoticeBanner>
        <Button label="Reintentar" variant="secondary" size="sm" loading={isRefetching} onPress={() => { void refetch(); }} />
      </View>
    );
  }

  if (!cities || cities.length === 0) {
    return (
      <View style={styles.group}>
        <NoticeBanner variant="info">Por ahora no hay ciudades disponibles. Intenta de nuevo más tarde.</NoticeBanner>
        <Button label="Reintentar" variant="secondary" size="sm" loading={isRefetching} onPress={() => { void refetch(); }} />
      </View>
    );
  }

  return (
    <View style={styles.group}>
      <View style={styles.chips}>
        {cities.map((city) => (
          <Chip key={city.id} label={city.name} selected={city.id === value} onPress={() => onChange(city)} />
        ))}
      </View>
      {selected ? (
        <Text variant="caption" color={tc.textSub}>
          {`${countryName(selected.countryCode)} · ${selected.currency}`}
        </Text>
      ) : null}
      {error ? <Text variant="caption" color={TOKENS.color.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: SPACING.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
});
