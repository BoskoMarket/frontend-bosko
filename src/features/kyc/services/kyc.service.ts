import api from '@/core/api/axiosinstance';
import { KYCVerification } from '../types/kyc.types';

export interface StartVerificationResponse {
  verificationId: string;
  inquiryId: string;
  sessionToken: string;
  verificationUrl: string;
  /** POST /identity/start answers `{ alreadyProvider: true }` (no session) for an existing provider. */
  alreadyProvider?: boolean;
}

export async function getKYCStatus(): Promise<KYCVerification | null> {
  try {
    const { data } = await api.get<KYCVerification>('/identity/status');
    return data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

export async function startVerification(): Promise<StartVerificationResponse> {
  const { data } = await api.post<StartVerificationResponse>('/identity/start');
  return data;
}

export async function retryVerification(): Promise<StartVerificationResponse> {
  const { data } = await api.post<StartVerificationResponse>('/identity/retry');
  return data;
}

export async function cancelVerification(): Promise<void> {
  await api.post('/identity/cancel');
}
