import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { buildWhatsappUrl } from '@/features/appConfig/utils/whatsapp';

const mockFetchConfig = jest.fn();
jest.mock('@/features/appConfig/services/appConfig.service', () => ({
  fetchAppConfig: () => mockFetchConfig(),
}));
jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.0.0' }));

import { SupportContactButton } from '@/features/appConfig/components/SupportContactButton';

function renderButton(props: React.ComponentProps<typeof SupportContactButton> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SupportContactButton {...props} />
    </QueryClientProvider>,
  );
}

describe('buildWhatsappUrl', () => {
  it('keeps only digits and encodes the message', () => {
    expect(buildWhatsappUrl('+54 9 2494 00-0000', 'Hola, ayuda')).toBe('https://wa.me/5492494000000?text=Hola%2C%20ayuda');
  });

  it('omits the text when there is no message', () => {
    expect(buildWhatsappUrl('5492494000000')).toBe('https://wa.me/5492494000000');
    expect(buildWhatsappUrl('5492494000000', '   ')).toBe('https://wa.me/5492494000000');
  });

  it('returns null without a usable number', () => {
    expect(buildWhatsappUrl(undefined)).toBeNull();
    expect(buildWhatsappUrl('')).toBeNull();
    expect(buildWhatsappUrl('abc')).toBeNull();
    expect(buildWhatsappUrl('123')).toBeNull();
  });
});

describe('SupportContactButton', () => {
  let openURL: jest.SpyInstance;
  beforeEach(() => {
    mockFetchConfig.mockReset();
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });
  afterEach(() => openURL.mockRestore());

  it('renders nothing while the backend provides no number', async () => {
    mockFetchConfig.mockResolvedValue({ minVersion: '0.0.0' });
    const { queryByText } = renderButton();
    await waitFor(() => expect(mockFetchConfig).toHaveBeenCalled());
    expect(queryByText('Contactar a soporte')).toBeNull();
  });

  it('opens WhatsApp with the configured number and the suggested message', async () => {
    mockFetchConfig.mockResolvedValue({ supportWhatsapp: '5492494000000', supportMessage: 'Hola Bosko.' });
    const { findByText } = renderButton({ message: 'Orden 42' });
    fireEvent.press(await findByText('Contactar a soporte'));
    expect(openURL).toHaveBeenCalledWith('https://wa.me/5492494000000?text=Hola%20Bosko.%20Orden%2042');
  });
});
