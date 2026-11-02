import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGet = jest.fn();
const mockPatch = jest.fn();
const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn() };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock('@/core/api/axiosinstance', () => ({
  __esModule: true,
  default: { get: (...a: any[]) => mockGet(...a), patch: (...a: any[]) => mockPatch(...a) },
}));
jest.mock('@/core/design-system/components/Toast', () => {
  const actual = jest.requireActual('@/core/design-system/components/Toast');
  return {
    ...actual,
    toast: {
      success: (...a: any[]) => mockToast.success(...a),
      error: (...a: any[]) => mockToast.error(...a),
      warning: (...a: any[]) => mockToast.warning(...a),
    },
  };
});

import AdminReportsScreen from '@/features/admin/screens/AdminReportsScreen';

const REPORT = {
  id: 'r1',
  status: 'pending',
  targetType: 'user',
  targetId: 'u9',
  reason: 'impersonation',
  details: 'Se hace pasar por otra persona',
  context: { type: 'chat', orderId: 'abcdef123456' },
  reporter: { id: 'u1', firstName: 'Ana', lastName: 'Gomez' },
  owner: 'owner-id-7',
  createdAt: '2026-10-20T12:00:00.000Z',
};

const page = (data: any[]) => ({ data: { data, total: data.length, page: 1, limit: 20 } });

function renderScreen() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdminReportsScreen />
    </QueryClientProvider>,
  );
}

jest.setTimeout(30000); // first render pulls the whole design system

beforeEach(() => jest.clearAllMocks());

describe('AdminReportsScreen', () => {
  it('lists pending reports with Spanish labels, reporter, owner and context', async () => {
    mockGet.mockResolvedValue(page([REPORT]));
    const { findByText, getByText } = renderScreen();

    expect(await findByText('Suplantación de identidad')).toBeTruthy();
    expect(getByText('Se hace pasar por otra persona')).toBeTruthy();
    expect(getByText('Ana Gomez')).toBeTruthy();
    expect(getByText('owner-id-7')).toBeTruthy();
    expect(getByText('Chat de la orden #abcdef12')).toBeTruthy();
    expect(getByText('Pendiente')).toBeTruthy();
    expect(mockGet).toHaveBeenCalledWith('/admin/reports', { params: { page: 1, limit: 20, status: 'pending' } });
  });

  it('switches the status filter and omits status for "Todas"', async () => {
    mockGet.mockResolvedValue(page([REPORT]));
    const { findByText, getByText } = renderScreen();
    await findByText('Suplantación de identidad');

    fireEvent.press(getByText('Revisadas'));
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/admin/reports', { params: { page: 1, limit: 20, status: 'reviewed' } }),
    );
    fireEvent.press(getByText('Todas'));
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/admin/reports', { params: { page: 1, limit: 20 } }),
    );
  });

  it('reviews a report with optional notes and shows a success toast', async () => {
    mockGet.mockResolvedValue(page([REPORT]));
    mockPatch.mockResolvedValue({ data: { ...REPORT, status: 'reviewed' } });
    const { findByText, getByText, getByPlaceholderText, getAllByText } = renderScreen();

    fireEvent.press(await findByText('Revisar'));
    expect(getByText('0/2000')).toBeTruthy();
    fireEvent.changeText(getByPlaceholderText('Notas internas'), 'Confirmado');
    expect(getByText('10/2000')).toBeTruthy();
    fireEvent.press(getAllByText('Revisar')[1]);

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith('/admin/reports/r1', { status: 'reviewed', notes: 'Confirmado' }),
    );
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('Denuncia revisada'));
  });

  it('dismisses without notes (notes omitted from the payload)', async () => {
    mockGet.mockResolvedValue(page([REPORT]));
    mockPatch.mockResolvedValue({ data: { ...REPORT, status: 'dismissed' } });
    const { findByText, getAllByText } = renderScreen();

    fireEvent.press(await findByText('Descartar'));
    fireEvent.press(getAllByText('Descartar')[1]);

    await waitFor(() => expect(mockPatch).toHaveBeenCalledWith('/admin/reports/r1', { status: 'dismissed' }));
  });

  it('toasts an error when the update fails', async () => {
    mockGet.mockResolvedValue(page([REPORT]));
    mockPatch.mockRejectedValue(new Error('boom'));
    const { findByText, getAllByText } = renderScreen();

    fireEvent.press(await findByText('Revisar'));
    fireEvent.press(getAllByText('Revisar')[1]);

    await waitFor(() => expect(mockToast.error).toHaveBeenCalled());
  });

  it('shows the admin-only state on 403', async () => {
    mockGet.mockRejectedValue({ isAxiosError: true, message: 'Forbidden', response: { status: 403, data: { code: 'FORBIDDEN', statusCode: 403, message: 'no' } } });
    const { findByText, queryByText } = renderScreen();

    expect(await findByText('Acceso solo para administradores')).toBeTruthy();
    expect(queryByText('Pendientes')).toBeNull();
  });

  it('shows an error with retry and an empty state', async () => {
    mockGet.mockRejectedValueOnce(new Error('network'));
    const first = renderScreen();
    expect(await first.findByText('No pudimos cargar las denuncias')).toBeTruthy();
    first.unmount();

    mockGet.mockResolvedValue(page([]));
    const second = renderScreen();
    expect(await second.findByText('No hay denuncias')).toBeTruthy();
  });
});
