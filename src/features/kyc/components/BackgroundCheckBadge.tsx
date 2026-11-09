import React from 'react';
import { Badge } from '@/core/design-system';

/** True when the (optional) public `backgroundCheckStatus` is approved, in any casing. */
export function isBackgroundCheckApproved(status?: string | null): boolean {
  return typeof status === 'string' && status.toUpperCase() === 'APPROVED';
}

/**
 * Optional trust badge. Renders nothing unless the provider's background check
 * is approved; it never signals a missing one.
 */
export function BackgroundCheckBadge({ status }: { status?: string | null }) {
  if (!isBackgroundCheckApproved(status)) return null;
  return <Badge label="Antecedentes verificados" tone="done" icon="shield-checkmark" />;
}
