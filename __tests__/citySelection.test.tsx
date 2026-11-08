import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { TERMS_VERSION } from '@/core/config/terms';
import { pendingGoogleSignup } from '@/features/auth/state/pendingGoogleSignup';

const mockCities = jest.fn();
jest.mock('@/hooks/queries/useCitiesQuery', () => ({ useCitiesQuery: () => mockCities() }));

const mockAuth = jest.fn();
jest.mock('@/features/auth/state/AuthContext', () => ({ useAuth: () => mockAuth() }));

const mockSetCity = jest.fn();
jest.mock('@/hooks/mutations/useCityMutation', () => ({
  useSetCity: () => ({ mutateAsync: mockSetCity }),
}));

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    router: { push: jest.fn(), replace: jest.fn() },
    Redirect: ({ href }: { href: string }) => <Text>redirect:{href}</Text>,
  };
});

import { CityPicker } from '@/features/auth/components/CityPicker';
import SelectCityScreen from '@/features/auth/screens/SelectCityScreen';

const CITIES = [
  { id: 'tandil', name: 'Tandil', countryCode: 'AR', currency: 'ARS', phonePrefix: '+54' },
  { id: 'barranquilla', name: 'Barranquilla', countryCode: 'CO', currency: 'COP', phonePrefix: '+57' },
];

beforeEach(() => {
  jest.clearAllMocks();
  pendingGoogleSignup.clear();
  mockCities.mockReturnValue({ data: CITIES, isPending: false, isError: false, isRefetching: false, refetch: jest.fn() });
});

describe('CityPicker', () => {
  it('shows a loading state', () => {
    mockCities.mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: jest.fn() });
    const ui = render(<CityPicker value={null} onChange={jest.fn()} />);
    expect(ui.getByLabelText('Cargando ciudades')).toBeTruthy();
  });

  it('shows an error with retry', () => {
    const refetch = jest.fn();
    mockCities.mockReturnValue({ data: undefined, isPending: false, isError: true, isRefetching: false, refetch });
    const ui = render(<CityPicker value={null} onChange={jest.fn()} />);
    expect(ui.getByText(/No pudimos cargar las ciudades/)).toBeTruthy();
    fireEvent.press(ui.getByText('Reintentar'));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows an empty state with retry', () => {
    mockCities.mockReturnValue({ data: [], isPending: false, isError: false, isRefetching: false, refetch: jest.fn() });
    const ui = render(<CityPicker value={null} onChange={jest.fn()} />);
    expect(ui.getByText(/no hay ciudades disponibles/)).toBeTruthy();
    expect(ui.getByText('Reintentar')).toBeTruthy();
  });

  it('lists the cities, reports the selection and shows country and currency', () => {
    const onChange = jest.fn();
    const ui = render(<CityPicker value="barranquilla" onChange={onChange} />);
    expect(ui.getByText('Colombia · COP')).toBeTruthy();
    fireEvent.press(ui.getByText('Tandil'));
    expect(onChange).toHaveBeenCalledWith(CITIES[0]);
  });

  it('shows the field error', () => {
    const ui = render(<CityPicker value={null} onChange={jest.fn()} error="Elige tu ciudad" />);
    expect(ui.getByText('Elige tu ciudad')).toBeTruthy();
  });
});

describe('SelectCityScreen', () => {
  const baseAuth = { authLoaded: true, isAuthenticated: false, isLoading: false, loginWithGoogle: jest.fn(), logout: jest.fn() };

  it('new Google user: needs a city and the terms, then retries the Google call with them', async () => {
    const loginWithGoogle = jest.fn().mockResolvedValue({});
    mockAuth.mockReturnValue({ ...baseAuth, loginWithGoogle });
    pendingGoogleSignup.set('firebase-token');
    const ui = render(<SelectCityScreen />);

    await act(async () => { fireEvent.press(ui.getByText('Continuar')); });
    expect(ui.getByText('Elige tu ciudad')).toBeTruthy();
    expect(ui.getByText('Debes aceptar los términos y la política de privacidad')).toBeTruthy();
    expect(loginWithGoogle).not.toHaveBeenCalled();

    fireEvent.press(ui.getByText('Tandil'));
    fireEvent.press(ui.getByLabelText('Acepto los términos y la política de privacidad'));
    await act(async () => { fireEvent.press(ui.getByText('Continuar')); });

    await waitFor(() =>
      expect(loginWithGoogle).toHaveBeenCalledWith('firebase-token', {
        cityId: 'tandil',
        acceptedTerms: true,
        termsVersion: TERMS_VERSION,
      }),
    );
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    expect(pendingGoogleSignup.get()).toBeNull();
    expect(mockSetCity).not.toHaveBeenCalled();
  });

  it('shows the backend error and keeps the token when the retry fails', async () => {
    const loginWithGoogle = jest.fn().mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { code: 'TERMS_NOT_ACCEPTED', message: 'x' } },
    });
    mockAuth.mockReturnValue({ ...baseAuth, loginWithGoogle });
    pendingGoogleSignup.set('firebase-token');
    const ui = render(<SelectCityScreen />);

    fireEvent.press(ui.getByText('Tandil'));
    fireEvent.press(ui.getByLabelText('Acepto los términos y la política de privacidad'));
    await act(async () => { fireEvent.press(ui.getByText('Continuar')); });

    expect(await ui.findByText('Debes aceptar los términos y la política de privacidad para continuar')).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
    expect(pendingGoogleSignup.get()).toBe('firebase-token');
  });

  it('signed-in account without city: PATCHes the city and does not ask for the terms', async () => {
    mockAuth.mockReturnValue({ ...baseAuth, isAuthenticated: true });
    mockSetCity.mockResolvedValue(undefined);
    const ui = render(<SelectCityScreen />);

    expect(ui.queryByLabelText('Acepto los términos y la política de privacidad')).toBeNull();
    fireEvent.press(ui.getByText('Barranquilla'));
    await act(async () => { fireEvent.press(ui.getByText('Continuar')); });

    await waitFor(() => expect(mockSetCity).toHaveBeenCalledWith('barranquilla'));
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('without a pending Google token and without a session it goes back to login', () => {
    mockAuth.mockReturnValue(baseAuth);
    const ui = render(<SelectCityScreen />);
    expect(ui.getByText('redirect:/login')).toBeTruthy();
  });

  it('cancelling a Google signup drops the token', async () => {
    mockAuth.mockReturnValue(baseAuth);
    pendingGoogleSignup.set('firebase-token');
    const ui = render(<SelectCityScreen />);
    await act(async () => { fireEvent.press(ui.getByText('Cancelar')); });
    expect(pendingGoogleSignup.get()).toBeNull();
    expect(router.replace).toHaveBeenCalledWith('/login');
  });
});
