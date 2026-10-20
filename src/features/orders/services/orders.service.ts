import { readCollection } from '@/core/api/collections';
/**
 * Servicio de órdenes.
 * Encapsula todas las llamadas al backend relacionadas con órdenes.
 * Cada función corresponde a un endpoint documentado en endpoints.md.
 */

import api from '@/core/api/axiosinstance';
import {
  CreateOrderPayload,
  DisputeOrderPayload,
  Order,
  PaginatedResponse,
  RejectOrderPayload,
} from '../types/orders.types';
import { normalizeOrder } from './normalizeOrder';

interface FetchOrdersParams {
  page?: number;
  limit?: number;
}

/** Obtener todas las órdenes del usuario autenticado (como cliente y proveedor) */
export async function fetchOrders(params?: FetchOrdersParams): Promise<Order[]> {
  const { data } = await api.get<any>('/orders', { params });
  return readCollection<any>(data).map(normalizeOrder);
}

/** Obtener órdenes donde el usuario es cliente */
export async function fetchOrdersAsClient(params?: FetchOrdersParams): Promise<Order[]> {
  const { data } = await api.get<any>('/orders/client', { params });
  return readCollection<any>(data).map(normalizeOrder);
}

/** Obtener órdenes donde el usuario es proveedor */
export async function fetchOrdersAsProvider(params?: FetchOrdersParams): Promise<Order[]> {
  const { data } = await api.get<any>('/orders/provider', { params });
  return readCollection<any>(data).map(normalizeOrder);
}

/** Obtener detalle de una orden por ID */
export async function fetchOrderById(id: string): Promise<Order> {
  const { data } = await api.get<any>(`/orders/${id}`);
  return normalizeOrder(data);
}

/** Crear una nueva orden (el cliente contrata un servicio) */
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await api.post<any>('/orders', payload);
  return normalizeOrder(data);
}

/** Proveedor acepta la orden */
export async function acceptOrder(id: string): Promise<Order> {
  const { data } = await api.patch<any>(`/orders/${id}/accept`);
  return normalizeOrder(data);
}

/** Proveedor rechaza la orden con un motivo */
export async function rejectOrder(id: string, payload: RejectOrderPayload): Promise<Order> {
  const { data } = await api.patch<any>(`/orders/${id}/reject`, payload);
  return normalizeOrder(data);
}

/** Proveedor inicia el trabajo */
export async function startOrder(id: string): Promise<Order> {
  const { data } = await api.patch<any>(`/orders/${id}/start`);
  return normalizeOrder(data);
}

/** Proveedor marca el trabajo como completado */
export async function completeOrder(id: string): Promise<Order> {
  const { data } = await api.patch<any>(`/orders/${id}/complete`);
  return normalizeOrder(data);
}

/** Cliente cancela la orden con un motivo */
export async function cancelOrder(id: string, payload: RejectOrderPayload): Promise<Order> {
  const { data } = await api.patch<any>(`/orders/${id}/cancel`, payload);
  return normalizeOrder(data);
}

/** Abrir disputa en una orden */
export async function disputeOrder(id: string, payload: DisputeOrderPayload): Promise<Order> {
  const { data } = await api.post<any>(`/orders/${id}/dispute`, payload);
  return normalizeOrder(data);
}
