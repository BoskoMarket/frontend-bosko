export type KYCStatus = 'in_progress' | 'approved' | 'rejected' | 'expired' | 'pending' | 'declined' | 'failed' | 'not_started';
export type DocumentType = 'DNI' | 'CC' | 'CEDULA' | 'PASAPORTE' | 'RUT';

export interface KYCVerification {
  status: KYCStatus;
  isVerified: boolean;
  inquiryId: string;
  attemptCount: number;
  maxAttempts: number;
  submittedAt: string | null;
  completedAt: string | null;
  rejectionReason?: string;
  /** Per-city document types (B10). Absent on older backends => default list. */
  allowedDocumentTypes?: string[];
}
