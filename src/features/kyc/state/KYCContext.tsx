import React from 'react';
import {
  useKYCStatus,
  useStartKYC,
  useRetryKYC,
} from '@/hooks/queries/useKYCQuery';
import type { KYCVerification, DocumentType } from '../types/kyc.types';
import { getUserErrorMessage } from '@/lib/errors';

interface SubmitDocumentsPayload {
  documentType: DocumentType;
  documentFront: string;
  documentBack: string;
  selfie: string;
}

export const KYCProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export const useKYC = () => {
  const query = useKYCStatus();
  const startMutation = useStartKYC();
  const retryMutation = useRetryKYC();

  const loading =
    query.isLoading ||
    startMutation.isPending ||
    retryMutation.isPending;

  const error = startMutation.error
    ? getUserErrorMessage(startMutation.error)
    : retryMutation.error
      ? getUserErrorMessage(retryMutation.error)
      : null;

  return {
    verification: query.data ?? null,
    kyc: query.data ?? null,
    loading,
    error,
    isVerified: query.data?.isVerified ?? false,
    refresh: async () => { await query.refetch(); },
    start: async () => { await startMutation.mutateAsync(); },
    retry: async () => { await retryMutation.mutateAsync(); },
    submit: async (_payload: SubmitDocumentsPayload) => {
      await startMutation.mutateAsync();
    },
    clearError: () => {},
  };
};
