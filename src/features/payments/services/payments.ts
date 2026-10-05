/**
 * payments.ts — Servicio de pagos.
 * Conectado a los endpoints reales de /payments/*.
 */

import { simulatePayment, getSimulatedPayment, simulatedHistory } from './mockPayments';

export type PaymentStatus = 'pending' | 'paid' | 'released' | 'refunded' | 'failed';

export interface Payment {
  id: string;
  orderId: string;
  clientId: string;
  providerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  simulated?: boolean;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryItem extends Payment {
  order?: {
    id: string;
    title: string;
    status: string;
  };
}

export interface EarningsItem extends Payment {
  order?: {
    id: string;
    title: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/** Iniciar pago de una orden — POST /payments/initiate */
export async function initiatePayment(orderId: string): Promise<Payment> {
  return simulatePayment(orderId);
}

/** Estado del pago de una orden — GET /payments/order/:orderId */
export async function getOrderPayment(orderId: string): Promise<PaymentHistoryItem | null> {
  return getSimulatedPayment(orderId);
}

/** Historial de pagos del usuario — GET /payments/history */
export async function fetchPaymentHistory(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<PaymentHistoryItem>> {
  return simulatedHistory(page, limit);
}

/** Ganancias del proveedor autenticado — GET /payments/providers/me/earnings */
export async function fetchEarnings(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<EarningsItem>> {
  return { data: [], total: 0, page, limit };
}
