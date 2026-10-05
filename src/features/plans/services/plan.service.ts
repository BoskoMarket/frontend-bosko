/**
 * Servicio de planes y suscripciones.
 * GET /plans, /plans/my-plan, POST/DELETE /subscriptions, GET /subscriptions/history
 */

import api from '@/core/api/axiosinstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '@/core/auth/tokenStorage';
import { readCollection } from '@/core/api/collections';
const storageKey = () => {
  const email = tokenStorage.getUserEmail();
  if (!email || !tokenStorage.getAccessToken()) throw new Error('Iniciá sesión para simular una suscripción.');
  return `BOSKO_MOCK_SUBSCRIPTIONS_v1:${encodeURIComponent(email.toLowerCase())}`;
};
async function readSubscriptions(): Promise<Subscription[]> {
  const value = await AsyncStorage.getItem(storageKey());
  return value ? JSON.parse(value) : [];
}


export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  highlighted?: boolean;
}

export interface MyPlan {
  plan: Plan;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodEnd: string;
}

export interface Subscription {
  id: string;
  planId: string;
  status: string;
  createdAt: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  plan?: Plan;
}

export interface PaginatedSubscriptions {
  data: Subscription[];
  total: number;
  page: number;
  limit: number;
}

/** Listar planes disponibles — GET /plans */
export async function fetchPlans(): Promise<Plan[]> {
  const { data } = await api.get<Plan[]>('/plans');
  return readCollection<Plan>(data);
}

/** Plan actual del usuario — GET /plans/my-plan */
export async function fetchMyPlan(): Promise<MyPlan | null> {
  const current = (await readSubscriptions()).find(row => row.status === 'active' && new Date(row.currentPeriodEnd).getTime() > Date.now());
  return current?.plan ? { plan: current.plan, status: 'active', currentPeriodEnd: current.currentPeriodEnd } : null;
}

/** Suscribirse a un plan — POST /subscriptions */
export async function subscribe(planId: string): Promise<Subscription> {
  const key = storageKey();
  const version = tokenStorage.getSessionVersion();
  const plans = await fetchPlans();
  const plan = plans.find(row => row.id === planId);
  if (!plan) throw new Error('No se encontró el plan.');
  const history = await readSubscriptions();
  const existing = history.find(row => row.planId === planId && row.status === 'active');
  if (existing) return existing;
  const until = new Date();
  if (plan.interval === 'year') until.setFullYear(until.getFullYear() + 1);
  else until.setMonth(until.getMonth() + 1);
  const subscription: Subscription = { id: `mock-${Date.now()}`, planId, plan, status: 'active', createdAt: new Date().toISOString(), currentPeriodEnd: until.toISOString() };
  if (version !== tokenStorage.getSessionVersion()) throw new Error('La sesión cambió.');
  await AsyncStorage.setItem(key, JSON.stringify([subscription, ...history.map(row => row.status === 'active' ? { ...row, status: 'cancelled' } : row)]));
  return subscription;
}

/** Cancelar suscripción — DELETE /subscriptions */
export async function cancelSubscription(): Promise<void> {
  const key = storageKey();
  const rows = await readSubscriptions();
  await AsyncStorage.setItem(key, JSON.stringify(rows.map(row => row.status === 'active' ? { ...row, status: 'cancelled', cancelledAt: new Date().toISOString() } : row))); 
}

/** Historial de suscripciones — GET /subscriptions/history */
export async function fetchSubscriptionHistory(
  page = 1,
  limit = 20,
): Promise<PaginatedSubscriptions> {
  const rows = await readSubscriptions();
  return { data: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit };
}
