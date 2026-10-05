import type { components } from '@/core/api/generated/schema';
/**
 * Tipos de dominio para el módulo de órdenes.
 * Reflejan exactamente el contrato del backend (ver endpoints.md).
 */

export type OrderStatus =
  | 'pending'       // Esperando respuesta del proveedor
  | 'accepted'      // Proveedor aceptó
  | 'in_progress'   // Trabajo en curso
  | 'completed'     // Trabajo terminado
  | 'cancelled'     // Cancelado por cliente o proveedor
  | 'disputed';     // En disputa

export type PaymentStatus = 'pending' | 'paid' | 'released' | 'refunded';

export interface OrderUser {
  id: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface OrderService {
  id: string;
  title: string;
  thumbnail?: string;
}

export interface OrderReview {
  id: string;
  rating: number;
  comment: string;
}

export interface Order {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  status: OrderStatus;
  title: string;
  clientMessage: string;
  agreedPrice?: number;
  scheduledDate?: string;
  address?: string;
  paymentStatus: PaymentStatus;
  cancellationReason?: string;
  cancelledBy?: string;
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  // Datos populados (detalle)
  client?: OrderUser;
  provider?: OrderUser;
  service?: OrderService;
  /** Reseña ya dejada por el cliente para esta orden, si existe (populado en GET /orders/:id) */
  review?: OrderReview | null;
  // Datos populados (lista — "la otra parte")
  otherParty?: OrderUser;
  role?: string;
}

/** Payload para crear una nueva orden (POST /orders) */
export type CreateOrderPayload = components['schemas']['CreateOrderDto'];

/** Payload para rechazar o cancelar con motivo */
export type RejectOrderPayload = components['schemas']['RejectOrderDto'];

export type DisputeOrderPayload = components['schemas']['DisputeDto'];

/** Respuesta paginada genérica */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
