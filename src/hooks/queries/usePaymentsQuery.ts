import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { useAuth } from '@/features/auth/state/AuthContext';
import {
  initiatePayment,
  getOrderPayment,
  fetchPaymentHistory,
  fetchEarnings,
} from '@/features/payments/services/payments';
import { toast } from '@/core/components/Toast';
import { getUserErrorMessage } from '@/lib/errors';

export function useOrderPayment(orderId: string | undefined) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.orderPayment(orderId!),
    queryFn: () => getOrderPayment(orderId!),
    enabled: isAuthenticated && !!orderId,
  });
}

export function usePaymentHistory(page = 1) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.paymentHistory(page),
    queryFn: () => fetchPaymentHistory(page),
    enabled: isAuthenticated,
  });
}

export function useEarnings(page = 1) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.earnings(page),
    queryFn: () => fetchEarnings(page),
    enabled: isAuthenticated,
  });
}

export function useInitiatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => initiatePayment(orderId),
    onSuccess: (payment) => {
      qc.setQueryData(QUERY_KEYS.orderPayment(payment.orderId), payment);
      qc.invalidateQueries({ queryKey: ['payments', 'history'] });
    },
    onError: (err, orderId) => {
      // PAYMENT_GATEWAY_ERROR / EXTERNAL_PROVIDER_ERROR / timeout: no asumir que
      // el pago falló — refrescar el estado real contra el server antes de reintentar.
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orderPayment(orderId) });
      toast.error('No se pudo confirmar el pago', getUserErrorMessage(err));
    },
  });
}
