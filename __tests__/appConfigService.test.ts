const mockGet = jest.fn();
jest.mock('@/core/api/axiosinstance', () => ({ __esModule: true, default: { get: (...a: any[]) => mockGet(...a) } }));

import { fetchAppConfig, resetAppConfigAvailability } from '@/features/appConfig/services/appConfig.service';

const httpError = (status: number) => Object.assign(new Error('http'), { response: { status } });

describe('fetchAppConfig', () => {
  beforeEach(() => { mockGet.mockReset(); resetAppConfigAvailability(); });

  it('returns the config when the endpoint exists', async () => {
    mockGet.mockResolvedValue({ data: { minVersion: '1.2.0' } });
    await expect(fetchAppConfig()).resolves.toEqual({ minVersion: '1.2.0' });
  });

  it('stops requesting after a 404 for the rest of the session', async () => {
    mockGet.mockRejectedValue(httpError(404));
    await expect(fetchAppConfig()).resolves.toBeNull();
    await expect(fetchAppConfig()).resolves.toBeNull();
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('keeps retrying after transient errors', async () => {
    mockGet.mockRejectedValueOnce(httpError(503)).mockResolvedValueOnce({ data: { maintenanceMode: true } });
    await expect(fetchAppConfig()).resolves.toBeNull();
    await expect(fetchAppConfig()).resolves.toEqual({ maintenanceMode: true });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});
