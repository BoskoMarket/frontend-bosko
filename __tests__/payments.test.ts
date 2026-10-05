import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchOrderById } from '@/features/orders/services/orders.service';
import { tokenStorage } from '@/core/auth/tokenStorage';
import { paymentBreakdown, simulatePayment, getSimulatedPayment, simulatedHistory } from '@/features/payments/services/mockPayments';

jest.mock('@/features/orders/services/orders.service', () => ({ fetchOrderById: jest.fn() }));
jest.mock('@/core/auth/tokenStorage', () => ({ tokenStorage: {
  getUserEmail: jest.fn(() => 'a@example.test'), getAccessToken: jest.fn(() => 'token'), getSessionVersion: jest.fn(() => 0),
} }));
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  jest.mocked(tokenStorage.getUserEmail).mockReturnValue('a@example.test');
  jest.mocked(tokenStorage.getSessionVersion).mockReturnValue(0);
  jest.mocked(fetchOrderById).mockResolvedValue({ id: 'order-1', status: 'accepted', agreedPrice: 100.5, clientId: 'a', providerId: 'b', title: 'Servicio' } as any);
});
test('usa el mismo total con centavos en el registro y no duplica una orden', async () => {
  expect(paymentBreakdown(100.5)).toEqual({ subtotal: 100.5, fee: 5.03, total: 105.53, currency: 'ARS' });
  const [a, b] = await Promise.all([simulatePayment('order-1'), simulatePayment('order-1')]);
  expect(a).toEqual(b);
  expect(a).toMatchObject({ amount: 105.53, simulated: true, status: 'paid' });
  expect(fetchOrderById).toHaveBeenCalledTimes(1);
  expect((await simulatedHistory(1, 20)).total).toBe(1);
});
test('no inventa un comprobante al abrir una orden sin simulación', async () => {
  expect(await getSimulatedPayment('missing')).toBeNull();
});
test('separa el historial de cada cuenta', async () => {
  await simulatePayment('order-1');
  jest.mocked(tokenStorage.getUserEmail).mockReturnValue('b@example.test');
  expect((await simulatedHistory(1, 20)).data).toEqual([]);
});
test('rechaza órdenes sin aceptar o sin precio', async () => {
  jest.mocked(fetchOrderById).mockResolvedValueOnce({ status: 'pending', agreedPrice: 100 } as any);
  await expect(simulatePayment('pending')).rejects.toThrow('aceptar');
  jest.mocked(fetchOrderById).mockResolvedValueOnce({ status: 'accepted' } as any);
  await expect(simulatePayment('no-price')).rejects.toThrow('precio');
  expect((await simulatedHistory(1, 20)).total).toBe(0);
});
test('una petición que termina tras cerrar sesión no guarda una simulación', async () => {
  jest.mocked(fetchOrderById).mockImplementationOnce(async () => {
    jest.mocked(tokenStorage.getSessionVersion).mockReturnValue(1);
    return { status: 'accepted', agreedPrice: 100 } as any;
  });
  await expect(simulatePayment('late')).rejects.toThrow('sesión cambió');
  expect((await simulatedHistory(1, 20)).total).toBe(0);
});
