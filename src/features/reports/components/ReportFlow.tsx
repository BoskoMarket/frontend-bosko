import React, { useCallback, useRef, useState } from 'react';
import { ReportSheet, toast, type ReportSheetSubmit } from '@/core/design-system';
import {
  REPORT_DETAILS_MAX_LENGTH,
  REPORT_OTHER_CODE,
  REPORT_REASONS,
  REPORT_SENT_MESSAGE,
  REPORT_SENT_TITLE,
} from '../constants/reportReasons';
import { reportErrorFeedback } from '../reportErrors';

export interface ReportFlowProps {
  visible: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  /** Performs the request for the concrete surface (reel, review, user). */
  submit: (value: ReportSheetSubmit) => Promise<unknown>;
}

/**
 * ReportFlow — shared report UX for every surface: ReportSheet + double-submit guard + toasts.
 * On error the sheet stays open (selection kept) so the user can retry.
 */
export function ReportFlow({ visible, title, message, onClose, submit }: ReportFlowProps) {
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);

  const handleSubmit = useCallback(async (value: ReportSheetSubmit) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      await submit(value);
      toast.success(REPORT_SENT_TITLE, REPORT_SENT_MESSAGE);
      onClose();
    } catch (err) {
      const fb = reportErrorFeedback(err);
      toast.error(fb.title, fb.message);
      // Reports that can never succeed (unavailable / already reported) close the sheet; others allow retry.
      if (fb.message === undefined) onClose();
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }, [submit, onClose]);

  return (
    <ReportSheet
      visible={visible}
      title={title}
      message={message}
      reasons={REPORT_REASONS}
      otherCode={REPORT_OTHER_CODE}
      maxDetailsLength={REPORT_DETAILS_MAX_LENGTH}
      submitting={submitting}
      onCancel={onClose}
      onSubmit={handleSubmit}
    />
  );
}
