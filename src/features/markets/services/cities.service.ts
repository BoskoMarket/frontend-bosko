import api from '@/core/api/axiosinstance';
import { readCollection } from '@/core/api/collections';
import type { City } from '../types';

/** GET /cities — public list of active cities. */
export async function fetchCities(): Promise<City[]> {
  const { data } = await api.get<unknown>('/cities');
  return readCollection<City>(data);
}
