import api from '@/core/api/axiosinstance';
import { fetchFeaturedServices } from '@/features/servicesUser/services/services';
import { getProviderRouteId, mapService } from '@/features/servicesUser/services/catalog';

jest.mock('@/core/api/axiosinstance', () => ({ __esModule: true, default: { get: jest.fn() } }));

const dto = {
  id: 'service-1',
  title: 'Instalación de tomas',
  description: 'Trabajo prolijo',
  images: ['https://cdn.test/a.jpg', 'https://cdn.test/b.jpg'],
  price: { amount: '1500', currency: 'ARS', unit: 'hora' },
  category: { id: 'cat-1', name: 'Electricidad' },
  provider: { id: 'provider-9', firstName: 'Tomas', lastName: 'Perez', avatarUrl: 'https://cdn.test/p.jpg' },
};

test('adapta un ServiceDto: providerId sale de provider.id y el id sigue siendo el del servicio', () => {
  const s = mapService(dto);
  expect(s.id).toBe('service-1');
  expect(s.providerId).toBe('provider-9');
  expect(s.categoryId).toBe('cat-1');
  expect(s.name).toBe('Tomas Perez');
  expect(s.thumbnail).toBe('https://cdn.test/a.jpg');
  expect(s.rate).toEqual({ amount: 1500, currency: 'ARS', unit: 'hora' });
});

test('fetchFeaturedServices devuelve ServiceSummary adaptados', async () => {
  (api.get as jest.Mock).mockResolvedValueOnce({ data: [dto] });
  const [first] = await fetchFeaturedServices();
  expect(api.get).toHaveBeenCalledWith('/services/featured');
  expect(first.providerId).toBe('provider-9');
  expect(first.thumbnail).toBe('https://cdn.test/a.jpg');
});

test('getProviderRouteId nunca cae al id del servicio', () => {
  expect(getProviderRouteId(mapService(dto))).toBe('provider-9');
  expect(getProviderRouteId(mapService({ ...dto, provider: undefined }))).toBeNull();
});
