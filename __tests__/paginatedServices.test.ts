import api from '@/core/api/axiosinstance';
import { fetchOrdersAsClient, fetchOrdersAsProvider } from '@/features/orders/services/orders.service';
import { getMyServices } from '@/features/servicesUser/services/service';
import { fetchServiceReviewsService } from '@/features/servicesUser/services/catalog';
import { getMyReels } from '@/features/reels/services/reels.service';

jest.mock('@/core/api/axiosinstance', () => ({ __esModule: true, default: { get: jest.fn() } }));

const get = api.get as jest.Mock;

beforeEach(() => get.mockReset());

it.each([
  ['/orders/client', fetchOrdersAsClient],
  ['/orders/provider', fetchOrdersAsProvider],
] as const)('keeps %s page metadata while normalizing orders', async (url, fetch) => {
  get.mockResolvedValueOnce({ data: {
    data: [{ id: 'o1', status: 'PENDING', client: { id: 'c1' }, provider: { id: 'p1' } }],
    total: 41, page: 2, limit: 20,
  } });
  const result = await fetch({ page: 2 });
  expect(get).toHaveBeenCalledWith(url, { params: { page: 2 } });
  expect(result).toMatchObject({ total: 41, page: 2, limit: 20, data: [{ id: 'o1', status: 'pending' }] });
});

it('preserves the own services total and maps prices', async () => {
  get.mockResolvedValueOnce({ data: { data: [{ id: 's1', price: { amount: 300 } }], total: 25, page: 1, limit: 20 } });
  const result = await getMyServices();
  expect(result.total).toBe(25);
  expect(result.data[0].price).toBe(300);
  expect(get).toHaveBeenCalledWith('/services/me', { params: { page: 1, limit: 20 } });
});

it('requests and returns a page of own reels and provider reviews', async () => {
  get.mockResolvedValueOnce({ data: { data: [{ id: 'r1' }], total: 21, page: 2, limit: 20 } });
  expect((await getMyReels(2)).data).toEqual([{ id: 'r1' }]);
  expect(get).toHaveBeenCalledWith('/reels/me', { params: { page: 2, limit: 20 } });
  get.mockResolvedValueOnce({ data: { data: [{ id: 'review1' }], total: 11, page: 2, limit: 10 } });
  expect((await fetchServiceReviewsService('p1', 2, 10)).total).toBe(11);
  expect(get).toHaveBeenCalledWith('/reviews/providers/p1/reviews', { params: { page: 2, limit: 10 } });
});
