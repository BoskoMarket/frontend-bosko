/**
 * Servicio de reseñas.
 * POST /reviews — crear reseña tras orden completada.
 */

import api from '@/core/api/axiosinstance';
import type { ReportPayload } from '@/features/reports/services/report.service';

export interface ReviewPayload {
  orderId: string;
  rating: number;
  comment: string;
}

export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  providerId: string;
  rating: number;
  comment: string;
  reply?: string;
  createdAt: string;
}

/** Crear reseña — POST /reviews */
export async function createReview(payload: ReviewPayload): Promise<Review> {
  const { data } = await api.post<Review>('/reviews', payload);
  return data;
}

/** Responder reseña — POST /reviews/:id/reply */
export async function replyToReview(reviewId: string, reply: string): Promise<Review> {
  const { data } = await api.post<Review>(`/reviews/${reviewId}/reply`, { reply });
  return data;
}

/**
 * Reportar reseña — POST /reviews/:id/report
 * Sends `{ reason, details? }` and receives a confirmation.
 */
export async function reportReview(reviewId: string, payload: ReportPayload): Promise<void> {
  await api.post(`/reviews/${reviewId}/report`, payload);
}
