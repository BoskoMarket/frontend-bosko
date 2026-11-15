import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { toast } from '@/core/design-system';

const mockCreate = jest.fn();
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ orderId: 'o1', providerName: 'Ana', serviceName: 'Pintura' }),
}));
jest.mock('@/core/navigation/safeBack', () => ({ safeBack: jest.fn() }));
jest.mock('@/components/AnimatedBackground', () => ({ AnimatedBackground: () => null }));
jest.mock('@/hooks/mutations/useReviewMutations', () => ({
  useCreateReview: () => ({ mutateAsync: mockCreate, isPending: false }),
}));

import ReviewScreen from '@/features/reviews/screens/ReviewScreen';

const validation = (field: string, message: string) => ({
  isAxiosError: true, message: 'x',
  response: { status: 400, data: { success: false, statusCode: 400, code: 'VALIDATION_ERROR', message: 'bad', details: [{ field, message }] } },
});

describe('ReviewScreen validation errors', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows comment details[] under the input without a toast', async () => {
    const errorToast = jest.spyOn(toast, 'error').mockImplementation(() => {});
    mockCreate.mockRejectedValueOnce(validation('comment', 'Comentario demasiado corto'));
    const { getByLabelText, getByText, findByText } = render(<ReviewScreen />);
    fireEvent.press(getByLabelText('4 estrellas: Bueno'));
    fireEvent.press(getByText('Enviar Reseña'));
    expect(await findByText('Comentario demasiado corto')).toBeTruthy();
    expect(errorToast).not.toHaveBeenCalled();
  });

  it('keeps the toast for fields the form has no input for', async () => {
    const errorToast = jest.spyOn(toast, 'error').mockImplementation(() => {});
    mockCreate.mockRejectedValueOnce(validation('rating', 'Calificación inválida'));
    const { getByLabelText, getByText } = render(<ReviewScreen />);
    fireEvent.press(getByLabelText('4 estrellas: Bueno'));
    fireEvent.press(getByText('Enviar Reseña'));
    await waitFor(() => expect(errorToast).toHaveBeenCalledWith('No pudimos enviar tu reseña', 'rating: Calificación inválida'));
  });
});
