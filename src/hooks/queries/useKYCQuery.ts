import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  getKYCStatus,
  startVerification,
  retryVerification,
  cancelVerification,
} from '@/features/kyc/services/kyc.service';
import { useAuth } from '@/features/auth/state/AuthContext';

export function useKYCStatus() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.kycStatus,
    queryFn: getKYCStatus,
    enabled: isAuthenticated,
    select: (data) => {
      if (!data) return null;
      return { ...data, status: data.status?.toLowerCase() };
    },
  });
}

async function launchDidit(sessionToken: string): Promise<'completed' | 'cancelled'> {
  const { startVerification: diditStartVerification } = await import('@didit-protocol/sdk-react-native');
  const result = await diditStartVerification(sessionToken, {
    languageCode: 'es',
    showCloseButton: true,
    showExitConfirmation: true,
    closeOnComplete: true,
  });

  if (result.type === 'failed') {
    throw new Error(
      result.error.type === 'sessionExpired'
        ? 'La sesión de verificación expiró. Por favor, intentá de nuevo.'
        : (result.error.message ?? 'Error en la verificación'),
    );
  }

  return result.type === 'completed' ? 'completed' : 'cancelled';
}

export function useStartKYC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await startVerification();
      if ('alreadyProvider' in response && response.alreadyProvider === true) return;
      if (!response.sessionToken) throw new Error('No se recibió token de verificación del servidor');
      const outcome = await launchDidit(response.sessionToken);
      if (outcome === 'cancelled') await cancelVerification();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.kycStatus });
    },
  });
}

export function useRetryKYC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await retryVerification();
      if (!response.sessionToken) throw new Error('No se recibió token de verificación del servidor');
      const outcome = await launchDidit(response.sessionToken);
      if (outcome === 'cancelled') await cancelVerification();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.kycStatus });
    },
  });
}
