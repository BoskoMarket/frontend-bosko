import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '@/core/auth/tokenStorage';
import { fetchOrderById } from '@/features/orders/services/orders.service';
import type { PaymentHistoryItem } from './payments';

export function paymentBreakdown(subtotal: number) {
  if (!Number.isFinite(subtotal) || subtotal <= 0) throw new Error('La orden todavía no tiene un precio válido.');
  const amount = Math.round(subtotal * 100) / 100;
  const fee = Math.round(amount * 0.05 * 100) / 100;
  return { subtotal: amount, fee, total: Math.round((amount + fee) * 100) / 100, currency: 'ARS' };
}
function accountKey() {
  const email = tokenStorage.getUserEmail();
  if (!email || !tokenStorage.getAccessToken()) throw new Error('Iniciá sesión para consultar tus simulaciones.');
  return `BOSKO_MOCK_PAYMENTS_v1:${encodeURIComponent(email.toLowerCase())}`;
}
async function read(key: string): Promise<PaymentHistoryItem[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  const rows: unknown = JSON.parse(raw);
  if (!Array.isArray(rows)) throw new Error('No se pudo leer el historial de simulaciones.');
  return rows;
}
let mutations: Promise<unknown> = Promise.resolve();
export function simulatePayment(orderId: string): Promise<PaymentHistoryItem> {
  const key = accountKey();
  const version = tokenStorage.getSessionVersion();
  const result = mutations.catch(() => {}).then(async () => {
    const rows = await read(key);
    const existing = rows.find(row => row.orderId === orderId);
    if (existing) return existing;
    const order = await fetchOrderById(orderId);
    if (version !== tokenStorage.getSessionVersion()) throw new Error('La sesión cambió. Volvé a intentarlo.');
    if (order.status !== 'accepted') throw new Error('El proveedor debe aceptar la orden antes de simular el pago.');
    const breakdown = paymentBreakdown(order.agreedPrice ?? 0);
    const timestamp = new Date().toISOString();
    const payment: PaymentHistoryItem = {
      id: `mock-${orderId}`, orderId, clientId: order.clientId, providerId: order.providerId,
      amount: breakdown.total, currency: breakdown.currency, status: 'paid', simulated: true,
      createdAt: timestamp, updatedAt: timestamp,
      order: { id: orderId, title: order.service?.title ?? order.title, status: order.status },
    };
    await AsyncStorage.setItem(key, JSON.stringify([payment, ...rows]));
    return payment;
  });
  mutations = result;
  return result;
}
export async function getSimulatedPayment(orderId: string) {
  return (await read(accountKey())).find(row => row.orderId === orderId) ?? null;
}
export async function simulatedHistory(page: number, limit: number) {
  const rows = await read(accountKey());
  return { data: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit };
}
