import { renderHook } from '@testing-library/react-native';
import { useProfile } from '@/features/profile/state/ProfileContext';

const mockQuery: { error: unknown } = { error: null };
jest.mock('@/hooks/queries/useProfileQuery', () => ({
  useProfile: () => ({ data: null, isLoading: false, error: mockQuery.error, refetch: jest.fn() }),
  useUpdateProfile: () => ({ mutateAsync: jest.fn() }),
  useToggleAvailability: () => ({ mutateAsync: jest.fn() }),
}));

const http = (status: number) => ({
  isAxiosError: true, message: 'x',
  response: { status, data: { success: false, statusCode: status, code: 'X', message: 'x' } },
});

it('differentiates profile load errors by kind', () => {
  const msg = (e: unknown) => { mockQuery.error = e; return renderHook(() => useProfile()).result.current.error; };
  const offline = msg({ isAxiosError: true, message: 'Network Error' });
  const notFound = msg(http(404));
  const server = msg(http(500));
  expect(new Set([offline, notFound, server]).size).toBe(3);
  mockQuery.error = null;
  expect(renderHook(() => useProfile()).result.current.error).toBeNull();
});
