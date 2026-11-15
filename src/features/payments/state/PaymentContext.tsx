import React, { useState } from 'react';
import { getLoadErrorMessage } from '@/lib/errors';
import type { Payment, PaymentHistoryItem, EarningsItem } from '../services/payments';
import {
  usePaymentHistory,
  useEarnings,
  useInitiatePayment,
  useOrderPayment,
} from '@/hooks/queries/usePaymentsQuery';

function paymentsLoadError(error: unknown): string {
  return error ? getLoadErrorMessage(error) : '';
}

export function PaymentsProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function usePayments() {
  const historyQ = usePaymentHistory(1);
  const earningsQ = useEarnings(1);
  const initiateM = useInitiatePayment();
  const [orderPaymentId, setOrderPaymentId] = useState<string | undefined>();
  const orderPaymentQ = useOrderPayment(orderPaymentId);

  const loadOrderPayment = (orderId: string) => {
    setOrderPaymentId(orderId);
  };

  return {
    orderPayment: orderPaymentQ.data ?? null,
    history: (historyQ.data?.data ?? []) as PaymentHistoryItem[],
    earnings: (earningsQ.data?.data ?? []) as EarningsItem[],
    loading: historyQ.isLoading || earningsQ.isLoading || initiateM.isPending,
    error: paymentsLoadError(historyQ.error ?? earningsQ.error),

    initiate: (orderId: string): Promise<Payment> => {
      setOrderPaymentId(orderId);
      return initiateM.mutateAsync(orderId);
    },
    loadOrderPayment,
    loadHistory: async () => { await historyQ.refetch(); },
    loadEarnings: async () => { await earningsQ.refetch(); },
    clearError: () => {},
  };
}
