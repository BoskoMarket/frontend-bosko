
/**
 * Order related API calls.
 *
 * Clients can request services by placing orders. Professionals
 * then accept and work on these orders. This module encapsulates
 * the calls for listing, creating and updating orders. Depending
 * on your backend design, orders may also include status changes
 * such as cancelled or completed.
 */

import api from "@/src/shared/utils/axiosinstance";

export interface Order {
  id?: string;
  serviceId: string;
  clientId: string;
  proId?: string;
  description: string;
  address: string;
  scheduledDate: string;
  status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  totalPrice?: number;
}

/**
 * fetchOrders
 *
 * GET `/orders`
 *
 * Retrieve a list of all orders. You may pass optional filters
 * such as by user ID or status. When the user is a pro, you
 * probably want to fetch orders where they are the assigned pro.
 */
// export async function fetchOrders(params?: Record<string, any>): Promise<Order[]> {
//   const { data } = await api.get<Order[]>('/orders', { params });
//   return data;
// }

/**
 * fetchOrderById
 *
 * GET `/orders/{id}`
 */
// export async function fetchOrderById(id: string): Promise<Order> {
//   const { data } = await api.get<Order>(`/orders/${id}`);
//   return data;
// }

/**
 * createOrder
 *
 * POST `/orders`
 *
 * A client can create an order for a service by providing a
 * description, address, scheduled date, etc. The backend will
 * assign a status of 'pending' until a pro accepts the job.
 */
export async function createOrder(payload: Omit<Order, 'id' | 'status'>): Promise<Order> {
  const { data } = await api.post<Order>('/orders', payload);
  return data;
}

/**
 * updateOrder
 *
 * PUT `/orders/{id}`
 *
 * Update order fields such as status or scheduledDate. Only
 * partial updates are required so the payload is partial.
 */
export async function updateOrder(id: string, payload: Partial<Order>): Promise<Order> {
  const { data } = await api.put<Order>(`/orders/${id}`, payload);
  return data;
}

/**
 * deleteOrder
 *
 * DELETE `/orders/{id}`
 *
 * Cancel or remove an order. The backend might return an empty
 * response or a message indicating success. Adjust as needed.
 */
export async function deleteOrder(id: string): Promise<{ message: string }> {
  const { data } = await api.delete(`/orders/${id}`);
  return data;
}
