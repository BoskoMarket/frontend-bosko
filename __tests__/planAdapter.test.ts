jest.mock('@/core/api/axiosinstance', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
jest.mock('@/core/auth/tokenStorage', () => ({ tokenStorage: {} }));

import api from '@/core/api/axiosinstance';
import { adaptPlan, fetchPlans } from '@/features/plans/services/plan.service';

describe('adaptPlan', () => {
  it('maps a real PlanDto into the client Plan', () => {
    const plan = adaptPlan({
      id: 'p1',
      name: 'Pro',
      type: 'PRO',
      price: { amount: '1999.5', currency: 'ARS' },
      maxServices: 10,
      prioritySupport: true,
      verifiedBadge: false,
    });
    expect(plan.price).toBe(1999.5);
    expect(plan.currency).toBe('ARS');
    expect(plan.interval).toBeUndefined();
    expect(plan.description).toBeUndefined();
    // Unknown benefit keys are not rendered as raw labels.
    expect(plan.features).toEqual(['Hasta 10 servicios']);
  });

  it('returns empty features when no benefits are present', () => {
    const plan = adaptPlan({ id: 'p0', type: 'FREE', price: { amount: 0, currency: 'ARS' } });
    expect(plan.name).toBe('FREE');
    expect(plan.price).toBe(0);
    expect(plan.features).toEqual([]);
  });

  it('survives a missing or malformed price', () => {
    const plan = adaptPlan({ id: 'x', price: null });
    expect(plan.price).toBe(0);
    expect(Array.isArray(plan.features)).toBe(true);
  });

  it('keeps the legacy client shape working', () => {
    const plan = adaptPlan({
      id: 'm1', name: 'Mock', description: 'd', price: 500, currency: 'USD',
      interval: 'year', features: ['a'], highlighted: true,
    });
    expect(plan).toMatchObject({ price: 500, currency: 'USD', interval: 'year', features: ['a'], highlighted: true, description: 'd' });
  });

  it('fetchPlans adapts the collection', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [{ id: 'p1', type: 'PRO', price: { amount: 10, currency: 'USD' }, maxServices: 1 }] });
    const plans = await fetchPlans();
    expect(plans[0].features).toEqual(['Hasta 1 servicio']);
    expect(plans[0].price).toBe(10);
  });
});

describe('adaptPlan features payload', () => {
  it('drops non-string features and keeps the derived maxServices benefit', () => {
    const plan = adaptPlan({
      id: 'p2',
      name: 'Pro',
      price: { amount: 10, currency: 'ARS' },
      maxServices: 10,
      features: [{ key: 'x' }, '', 'Soporte prioritario'] as unknown as string[],
    } as any);
    expect(plan.features).toEqual(['Hasta 10 servicios', 'Soporte prioritario']);
  });
});
