import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockFetchConfig = jest.fn();
jest.mock('@/features/appConfig/services/appConfig.service', () => ({
  fetchAppConfig: () => mockFetchConfig(),
}));
jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.0.0' }));

import { DisputeSupportNotice } from '@/features/orders/components/DisputeSupportNotice';

const mount = (status: string) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DisputeSupportNotice orderId="ord-42" status={status} />
    </QueryClientProvider>,
  );
};

describe('DisputeSupportNotice', () => {
  let openURL: jest.SpyInstance;
  beforeEach(() => {
    mockFetchConfig.mockReset().mockResolvedValue({ supportWhatsapp: '5492494000000', supportMessage: '' });
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });
  afterEach(() => openURL.mockRestore());

  it('renders the next step and support button for a disputed order, with the order id in the message', async () => {
    const ui = mount('disputed');
    expect(ui.getByText('Soporte revisará el caso. Te contactaremos por WhatsApp.')).toBeTruthy();
    fireEvent.press(await ui.findByText('Contactar a soporte'));
    await waitFor(() => expect(openURL).toHaveBeenCalled());
    const url = decodeURIComponent(openURL.mock.calls[0][0]);
    expect(url).toContain('ord-42');
  });

  it.each(['pending', 'accepted', 'completed', 'cancelled'])('renders nothing for %s', (status) => {
    const ui = mount(status);
    expect(ui.toJSON()).toBeNull();
    expect(mockFetchConfig).not.toHaveBeenCalled();
  });
});
