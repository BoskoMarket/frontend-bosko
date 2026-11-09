import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGet = jest.fn();
jest.mock('@/core/api/axiosinstance', () => ({
  __esModule: true,
  default: { get: (...args: unknown[]) => mockGet(...args), patch: jest.fn() },
}));

import { fetchCities } from '@/features/markets/services/cities.service';
import { useCitiesQuery } from '@/hooks/queries/useCitiesQuery';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  findCity,
  phoneCountryMismatchMessage,
  phoneMatchesCity,
  phonePrefixHint,
} from '@/features/markets/utils/phone';
import { needsCity } from '@/features/auth/utils/cityGate';
import { getUserErrorMessage } from '@/lib/errors';
import type { City } from '@/features/markets/types';

const TANDIL: City = { id: 'tandil', name: 'Tandil', countryCode: 'AR', currency: 'ARS', phonePrefix: '+54' };
const BARRANQUILLA: City = { id: 'barranquilla', name: 'Barranquilla', countryCode: 'CO', currency: 'COP', phonePrefix: '+57' };

describe('cities service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls GET /cities and accepts a plain array', async () => {
    mockGet.mockResolvedValueOnce({ data: [TANDIL, BARRANQUILLA] });
    await expect(fetchCities()).resolves.toEqual([TANDIL, BARRANQUILLA]);
    expect(mockGet).toHaveBeenCalledWith('/cities');
  });

  it('accepts the paginated shape { data: [] }', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [TANDIL], total: 1, page: 1, limit: 20 } });
    await expect(fetchCities()).resolves.toEqual([TANDIL]);
  });

  it('rejects an unexpected shape', async () => {
    mockGet.mockResolvedValueOnce({ data: { cities: [] } });
    await expect(fetchCities()).rejects.toThrow();
  });
});

describe('useCitiesQuery', () => {
  it('loads the list under QUERY_KEYS.cities and caches it', async () => {
    mockGet.mockResolvedValueOnce({ data: [TANDIL] });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCitiesQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([TANDIL]);
    expect(client.getQueryData(QUERY_KEYS.cities)).toEqual([TANDIL]);
  });
});

describe('phone helpers', () => {
  it('finds the city by id', () => {
    expect(findCity([TANDIL, BARRANQUILLA], 'barranquilla')).toBe(BARRANQUILLA);
    expect(findCity([TANDIL], 'nope')).toBeUndefined();
    expect(findCity(undefined, 'tandil')).toBeUndefined();
    expect(findCity([TANDIL], null)).toBeUndefined();
  });

  it('shows the expected prefix of the city', () => {
    expect(phonePrefixHint(TANDIL)).toBe('Debe ser un número de Argentina (+54)');
    expect(phonePrefixHint(BARRANQUILLA)).toBe('Debe ser un número de Colombia (+57)');
    expect(phonePrefixHint(undefined)).toBeNull();
  });

  it('builds the PHONE_COUNTRY_MISMATCH message with country and prefix, or a neutral one', () => {
    expect(phoneCountryMismatchMessage(BARRANQUILLA)).toBe('El teléfono debe ser de Colombia (+57)');
    expect(phoneCountryMismatchMessage(undefined)).toBe('El teléfono no corresponde al país de tu ciudad');
  });

  it('checks the prefix only when the city is known', () => {
    expect(phoneMatchesCity('+5491112345678', TANDIL)).toBe(true);
    expect(phoneMatchesCity('+573001234567', TANDIL)).toBe(false);
    expect(phoneMatchesCity('+573001234567', undefined)).toBe(true);
  });
});

describe('city gate', () => {
  it('only a null city (the API says there is none) triggers the gate', () => {
    expect(needsCity(null)).toBe(true);
    expect(needsCity(undefined)).toBe(false);
    expect(needsCity({ id: 'tandil', name: 'Tandil', currency: 'ARS' })).toBe(false);
  });
});

describe('market error codes', () => {
  const apiError = (code: string) => ({ isAxiosError: true, response: { status: 422, data: { code, message: 'x' } } });

  it.each([
    ['CITY_NOT_FOUND', 'La ciudad elegida no está disponible. Elige otra'],
    ['CITY_REQUIRED', 'Elige tu ciudad para continuar'],
    ['CITY_ALREADY_SET', 'Tu ciudad ya está definida. Para cambiarla, contacta a soporte'],
    ['TERMS_NOT_ACCEPTED', 'Debes aceptar los términos y la política de privacidad para continuar'],
    ['CITY_MISMATCH', 'Este servicio no está disponible en tu ciudad.'],
    ['PHONE_COUNTRY_MISMATCH', 'El teléfono no corresponde al país de tu ciudad'],
  ])('%s has a neutral Spanish message', (code, message) => {
    expect(getUserErrorMessage(apiError(code))).toBe(message);
  });
});
