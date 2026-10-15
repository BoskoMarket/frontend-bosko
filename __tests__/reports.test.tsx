import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useThemeStore } from '@/stores/theme.store';

const mockPost = jest.fn();
const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn() };
let mockProfile: any = { id: 'me' };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/core/api/axiosinstance', () => ({
  __esModule: true,
  default: {
    post: (...a: any[]) => mockPost(...a),
    get: (url: string) => {
      if (url.includes('/public')) {
        return Promise.resolve({ data: { id: 'prov1', firstName: 'Ana', lastName: 'Gomez', rating: 4, reviewsCount: 2 } });
      }
      if (url.includes('/reviews/providers')) {
        return Promise.resolve({
          data: {
            data: [
              { id: 'r-other', rating: 5, comment: 'Excelente', createdAt: '', reviewer: { id: 'u2', firstName: 'Luis', lastName: 'P' } },
              { id: 'r-mine', rating: 4, comment: 'Bien', createdAt: '', reviewer: { id: 'me', firstName: 'Yo', lastName: 'Mismo' } },
            ],
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    },
  },
}));
jest.mock('@/hooks/queries/useProfileQuery', () => ({ useProfile: () => ({ data: mockProfile }) }));
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: jest.fn() }));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'prov1' }),
}));
jest.mock('@/features/servicesUser/components/ServiceDetailModal', () => ({ ServiceDetailModal: () => null }));
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

import { ReportSheet } from '@/core/design-system';
import { ReportFlow } from '@/features/reports/components/ReportFlow';
import { canReport } from '@/features/reports/canReport';
import { reportErrorFeedback } from '@/features/reports/reportErrors';
import { REPORT_REASONS } from '@/features/reports/constants/reportReasons';
import { reportUser } from '@/features/reports/services/report.service';
import { reportReel } from '@/features/reels/services/reels.service';
import { reportReview } from '@/features/reviews/services/review.service';
import ProviderProfileScreen from '@/features/servicesUser/screens/ProviderProfileScreen';

const httpError = (status: number, code?: string) =>
  Object.assign(new Error('x'), {
    isAxiosError: true,
    response: { status, data: code ? { success: false, statusCode: status, code, message: 'm', timestamp: '' } : undefined },
  });

describe('report reasons', () => {
  it('exposes the stable machine codes with Spanish labels', () => {
    expect(REPORT_REASONS.map((r) => r.code)).toEqual(['spam', 'inappropriate', 'harassment', 'fraud', 'impersonation', 'other']);
    expect(REPORT_REASONS.map((r) => r.label)).toContain('Suplantación de identidad');
  });
});

describe.each(['dark', 'light'] as const)('ReportSheet (%s)', (mode) => {
  beforeEach(() => { act(() => { useThemeStore.getState().setMode(mode); }); });
  afterAll(() => { act(() => { useThemeStore.getState().setMode('dark'); }); });

  const setup = (extra: Partial<React.ComponentProps<typeof ReportSheet>> = {}) => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    const utils = render(
      <ReportSheet visible title="Reportar" reasons={REPORT_REASONS} onSubmit={onSubmit} onCancel={onCancel} {...extra} />,
    );
    return { ...utils, onSubmit, onCancel };
  };

  it('renders every reason and keeps confirm disabled until one is chosen', () => {
    const { getByLabelText, getByText, onSubmit } = setup();
    REPORT_REASONS.forEach((r) => expect(getByLabelText(r.label)).toBeTruthy());
    fireEvent.press(getByText('Enviar reporte'));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.press(getByLabelText('Spam o publicidad'));
    fireEvent.press(getByText('Enviar reporte'));
    expect(onSubmit).toHaveBeenCalledWith({ reason: 'spam' });
  });

  it('requires trimmed details for "Otro" and sends them', () => {
    const { getByLabelText, getByText, getByPlaceholderText, onSubmit } = setup();
    fireEvent.press(getByLabelText('Otro'));
    fireEvent.press(getByText('Enviar reporte'));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.changeText(getByPlaceholderText('Describí el problema'), '   ');
    fireEvent.press(getByText('Enviar reporte'));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.changeText(getByPlaceholderText('Describí el problema'), '  me insultó  ');
    fireEvent.press(getByText('Enviar reporte'));
    expect(onSubmit).toHaveBeenCalledWith({ reason: 'other', details: 'me insultó' });
  });

  it('locks the options and cancel while submitting', () => {
    const { getByLabelText, onCancel } = setup({ submitting: true });
    fireEvent.press(getByLabelText('Cerrar'));
    expect(onCancel).not.toHaveBeenCalled();
    expect(getByLabelText('Spam o publicidad').props.accessibilityState.disabled).toBe(true);
  });
});

describe('reportErrorFeedback', () => {
  it.each([404, 405, 501])('maps %s to "not available yet"', (status) => {
    expect(reportErrorFeedback(httpError(status))).toEqual({ title: 'Los reportes todavía no están disponibles.' });
  });
  it('maps 409 ALREADY_REPORTED', () => {
    expect(reportErrorFeedback(httpError(409, 'ALREADY_REPORTED')).title).toBe('Ya reportaste esto.');
  });
  it('falls back to a retryable error', () => {
    const fb = reportErrorFeedback(httpError(500));
    expect(fb.title).toBe('No se pudo enviar el reporte');
    expect(fb.message).toBeTruthy();
  });
});

describe('ReportFlow', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  const open = (submit: jest.Mock, onClose = jest.fn()) => {
    const utils = render(<ReportFlow visible title="Reportar" onClose={onClose} submit={submit} />);
    fireEvent.press(utils.getByLabelText('Fraude o estafa'));
    return { ...utils, onClose };
  };

  it('submits once, toasts success and closes', async () => {
    let resolve!: () => void;
    const submit = jest.fn(() => new Promise<void>((r) => { resolve = r; }));
    const { getByText, onClose } = open(submit);
    const confirm = getByText('Enviar reporte');
    fireEvent.press(confirm);
    fireEvent.press(confirm); // double tap on the same (stale) node
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith({ reason: 'fraud' });
    await act(async () => { resolve(); });
    expect(mockToast.success).toHaveBeenCalledWith('Reporte enviado', 'El equipo de Bosko lo va a revisar.');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows "no disponibles" on 404 and closes', async () => {
    const submit = jest.fn().mockRejectedValue(httpError(404));
    const { getByText, onClose } = open(submit);
    fireEvent.press(getByText('Enviar reporte'));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Los reportes todavía no están disponibles.', undefined));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows "Ya reportaste esto." on 409 ALREADY_REPORTED', async () => {
    const submit = jest.fn().mockRejectedValue(httpError(409, 'ALREADY_REPORTED'));
    const { getByText } = open(submit);
    fireEvent.press(getByText('Enviar reporte'));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Ya reportaste esto.', undefined));
  });

  it('keeps the sheet open on a generic error so the user can retry', async () => {
    const submit = jest.fn().mockRejectedValueOnce(httpError(500)).mockResolvedValueOnce(undefined);
    const { getByText, onClose } = open(submit);
    fireEvent.press(getByText('Enviar reporte'));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('No se pudo enviar el reporte', expect.any(String)));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.press(getByText('Enviar reporte'));
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
    expect(submit).toHaveBeenCalledTimes(2);
  });
});

describe('report services send the right payload', () => {
  beforeEach(() => { mockPost.mockReset().mockResolvedValue({ data: {} }); });

  it('reels: only { reason } (backend DTO), details appended to the code', async () => {
    await reportReel('reel1', 'spam');
    expect(mockPost).toHaveBeenLastCalledWith('/reels/reel1/report', { reason: 'spam' });
    await reportReel('reel1', 'other', 'texto');
    expect(mockPost).toHaveBeenLastCalledWith('/reels/reel1/report', { reason: 'other: texto' });
  });

  it('reviews: reason + details (proposed body)', async () => {
    await reportReview('rev1', { reason: 'other', details: 'x' });
    expect(mockPost).toHaveBeenCalledWith('/reviews/rev1/report', { reason: 'other', details: 'x' });
  });

  it('users: chat and profile contexts (proposed endpoint)', async () => {
    await reportUser('u1', { reason: 'harassment', context: { type: 'chat', orderId: 'o1' } });
    expect(mockPost).toHaveBeenLastCalledWith('/users/u1/report', { reason: 'harassment', context: { type: 'chat', orderId: 'o1' } });
    await reportUser('u1', { reason: 'fraud', details: 'd', context: { type: 'profile' } });
    expect(mockPost).toHaveBeenLastCalledWith('/users/u1/report', { reason: 'fraud', details: 'd', context: { type: 'profile' } });
  });
});

describe('canReport', () => {
  it('hides the option for own content and while ids are unknown', () => {
    expect(canReport('a', 'b')).toBe(true);
    expect(canReport('a', 'a')).toBe(false);
    expect(canReport(undefined, 'a')).toBe(false);
    expect(canReport('a', undefined)).toBe(false);
  });
});

describe('ProviderProfileScreen report entries', () => {
  beforeEach(() => { jest.clearAllMocks(); mockProfile = { id: 'me' }; mockPost.mockResolvedValue({ data: {} }); });

  it('offers report only on other people\'s reviews and submits the review report', async () => {
    const { findByText, getAllByLabelText, getByLabelText, getByText } = render(<ProviderProfileScreen />);
    await findByText('Excelente');
    expect(getAllByLabelText('Reportar reseña')).toHaveLength(1); // not on the viewer's own review
    fireEvent.press(getByLabelText('Reportar reseña'));
    fireEvent.press(getByLabelText('Acoso o lenguaje ofensivo'));
    fireEvent.press(getByText('Enviar reporte'));
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith('/reviews/r-other/report', { reason: 'harassment', details: undefined }),
    );
  });

  it('shows the profile menu for others but not on the viewer\'s own profile', async () => {
    const { findByText, queryByLabelText, unmount } = render(<ProviderProfileScreen />);
    await findByText('Excelente');
    expect(queryByLabelText('Más opciones del perfil')).toBeTruthy();
    unmount();
    mockProfile = { id: 'prov1' };
    const own = render(<ProviderProfileScreen />);
    await own.findByText('Excelente');
    expect(own.queryByLabelText('Más opciones del perfil')).toBeNull();
  });
});
