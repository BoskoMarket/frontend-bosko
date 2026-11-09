import React from 'react';
import { render } from '@testing-library/react-native';
import { BackgroundCheckBadge, isBackgroundCheckApproved } from '@/features/kyc/components/BackgroundCheckBadge';

describe('BackgroundCheckBadge (optional trust badge)', () => {
  it('shows "Antecedentes verificados" when approved, in any casing', () => {
    expect(render(<BackgroundCheckBadge status="APPROVED" />).getByText('Antecedentes verificados')).toBeTruthy();
    expect(render(<BackgroundCheckBadge status="approved" />).getByText('Antecedentes verificados')).toBeTruthy();
  });

  it.each([undefined, null, '', 'NOT_SUBMITTED', 'UNDER_REVIEW', 'REJECTED'])('renders nothing for %p', (status) => {
    const { toJSON } = render(<BackgroundCheckBadge status={status as string | undefined} />);
    expect(toJSON()).toBeNull();
    expect(isBackgroundCheckApproved(status as string | undefined)).toBe(false);
  });
});
